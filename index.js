require('./timber_compiled.js');
var parser = getModule('parser.js');

var filesProcessing = [];
var parseMode = 'files';
var output = 'compiled.js';
var home = false;

// build settings
process.argv.splice(0, 2);
var options = { homeDir: [] };
var currentSetting = 'homeDir';
for(var i in process.argv) {
    var arg = process.argv[i];
    if(arg[0] === '-') {
        currentSetting = arg.substr(1);
        if(!options[currentSetting])
            options[currentSetting] = [];
        continue;
    }
    options[currentSetting].push(arg);
}

new parser(options);
