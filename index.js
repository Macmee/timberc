require('./timber_compiled.js');
var parser = getModule('parser.js');


var fs = require('fs');
data = fs.readFileSync('../timber/test/js/boot.js', 'utf8');
var test = getModule('tokenFinder.js');
return new test(data)



var filesProcessing = [];
var parseMode = 'files';
var output = 'compiled.js';
var home = false;

// build settings
process.argv.splice(0, 2);
var options = {};
var currentSetting = 'homeDir';
for(var i in process.argv) {
    var arg = process.argv[i];
    if(arg[0] === '-') {
        currentSetting = arg.substr(1);
        continue;
    }
    if(typeof options[currentSetting] === 'undefined')
        options[currentSetting] = [ arg ];
    else
        options[currentSetting].push(arg);
}

new parser(options);
