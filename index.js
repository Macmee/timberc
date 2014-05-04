require('./timber_compiled.js');
var parser = getModule('parser.js');

var filesProcessing = [];
var parseMode = 'files';
var output = 'compiled.js';
var home = false;
process.argv.splice(0, 2);

new parser(output, process.argv[0]);
