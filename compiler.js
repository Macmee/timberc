require('../timber/timber_compiled.js');
var parser = getModule('parser.js');

var filesProcessing = [];
var parseMode = 'files';
var output = 'compiled.js';
var home = false;
process.argv.splice(0, 2);
/*process.argv.forEach(function (val, index, array) {
    if(val === '-o')
        parseMode = 'output';
    if(val === '-h')
        parseMode = 'home';
    else if(parseMode === 'home') {
        home = val;
        parseMode = 'files';
    }else if(parseMode === 'files')
        filesProcessing.push(val);
    else if(parseMode === 'output') {
        output = val;
        parseMode = 'files';
    }
});*/

new parser(output, process.argv[0]);
