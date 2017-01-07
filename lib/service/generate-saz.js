var fs = require('fs');
var path = require('path');
var Zip = require('node-native-zip');
var util = require('./util');

var fiddler4Types = fs.readFileSync(path.join(__dirname, '../../assets/fiddler/v4/[Content_Types].xml'));

function filterSessions(sessions) {
  return sessions.filter(function(item) {
    if (!item || !item.path || !item.req) {
      return;
    }
    return item && item.path && item.req;
  });
}

module.exports = function(body) {
  var isFiddler2 = body.exportFileType === 'Fiddler2';
  if (!isFiddler2 && body.exportFileType !== 'Fiddler4') {
    return false;
  }
  var sessions = util.parseJSON(body.sessions);
  if (!Array.isArray(sessions)) {
    return '';
  }
  sessions = filterSessions(sessions);
  var count = isFiddler2 ? 4 : String(sessions.length).length;
  var index = 0;
  var getName = function() {
    var name = (isFiddler2 ? index : index + 1) + '';
    ++index;
    var paddingCount = count - name.length;
    if (paddingCount <= 0) {
      return name;
    }
    return new Array(paddingCount + 1).join('0') + name;
  };
  
  var zip = new Zip();
  !isFiddler2 && zip.add('[Content_Types].xml', fiddler4Types);
  sessions.map(function(item) {
    item.req.path = item.path;
    var req = util.getReqRaw(item.req);
    var res = !item.res || item.res.statusCode == null ? 
        undefined : util.getResRaw(item.res);
    var name = getName();
    zip.add('raw/' + name + '_c.txt', new Buffer(req || ''));
    zip.add('raw/' + name + '_m.txt', new Buffer(''));
    zip.add('raw/' + name + '_s.txt', new Buffer(res || ''));
  });
  
  return zip.toBuffer();
};