timber({

    requires: ['fs', 'objectParser', 'node_modules/httpsync', ':handlebars', 'node_modules/cli-color clc'],

    private: {
        paths: {},
        dependencies: [],
        identifiers: /requires:|\.addPath\(|extends:|getModule\(/gm,
        fileCache: {}
    },
    
 init: function(options) {

        // determine where to save file
        var saveTo = options.out ? options.out[0] : 'compiled.js';
     
        // make sure we have a home dir
        if(!options.homeDir) {
            var msg = clc.yellow('[WARNING] The first argument to timberc was not a directory to your source, using cwd.');
            console.log(msg);
            this.private.homeDir = '';
        }else{
            this.private.homeDir = options.homeDir[0];
            process.chdir(this.private.homeDir);
        }

        // determine where to look for source
        var sourceFolders = options.only ? options.only : [''];

        // scan project for source code
        for(var i in sourceFolders)
            this.transverseProject(sourceFolders[i]);

        // generate array of output
        var output = this.buildDependencies();

        // save
        this.saveDependencies(saveTo, output);

    },

    saveDependencies: function(saveTo, output) {
        
        var saveLocation = timber.pkgEnv.resolvePath(saveTo, this.private.homeDir);
        fs.writeFile(saveTo, '/*COMPILED*/' + output.join(''), function(err) {
            if(err) {
                console.log(err);
            } else {
                var msg = clc.green('Successfully compiled ' + output.length + ' dependencies to "' + saveLocation + "\"");
                console.log(msg);
                var not = clc.bold.underline('NOT');
                var msg = clc.cyan('Do ' + not + ' move this file outside of the directory it was generated in.');
                console.log(msg);
            }
        });        
    },

    buildDependencies: function(output) {

        var alreadyParsed = {};
        var dep;
        var output = [];
        while( dep = this.private.dependencies.shift() ) {

            // find path to file
            var filePath = timber.pkgEnv.resolvePath(dep.file, dep.base, this.private.paths);

            // only compute each file once
            if(alreadyParsed[filePath])
                continue;
            alreadyParsed[filePath] = true;

            // process the given file
            var code = this.processFile(filePath, undefined, dep.requestedBy);

            // create a context for this dependency and add to output
            output.push(this.builtRunInContext(code, filePath));

        }

        return output;
        
    },

    builtRunInContext: function(code, fileName) {

        var base = timber.pkgEnv.basePath(fileName);

        return '\
timber.pkgEnv.precompiled["' + fileName + '"] = (function(pkgEnv){\
function getModule(filename) {\
    return pkgEnv.getModule_real(filename, "' + base + '")\
};\
var module = { exports: { __undefined: true } };\
var oldContext = pkgEnv.createContext("' + base + '");\
var exports={};\
' + code + ';\
var thisClass = pkgEnv.latestClass;\
pkgEnv.restoreContext(oldContext);\
\
exports = module.exports;\
delete module.exports;\
if(typeof exports !== "undefined" && !exports.__undefined) {\
    return exports;\
}else if(Object.keys(module).length > 0) {\
    return module;\
}else{\
    return thisClass;\
}\
});';
        
    },

    // transverse all files, generate paths and dependencies
    transverseProject: function(file) {

        var isDir = !file || fs.lstatSync(file).isDirectory();

        // if this is a directory, transverse it and process each file
        if(isDir) {
            var files = fs.readdirSync(file ? file : '.');
            for(var i in files) {
                var path = file + files[i];
                if(fs.lstatSync(path).isDirectory()) {
                    this.transverseProject(path + '/');
                }else if(timber.endsWith(path, '.js') || timber.endsWith(path, '.htm') || timber.endsWith(path, '.html')) {
                    this.processFile(path, file);
                }
            }

        // just process this if its a file
        }else{
            this.processFile(file, timber.pkgEnv.basePath(file));
        }
    },

    processFile: function(fileName, base, requestedBy) {

        // web resources 
        if(fileName.substr(0, 4) === 'http')
            return httpsync.get(fileName).end().data.toString();        
        
        // only allow processFile to run once per file
        var fileID;
        try{
            fileID = fs.lstatSync(fileName).ino;
            if(this.private.fileCache[fileID])
                return this.private.fileCache[fileID];            
        }catch(e) {
            var errorText = '[WARNING] Could not locate "' + fileName + '"';
            if(requestedBy)
                errorText += ' requested from "' + requestedBy + '"';
            errorText += ', skipping file..';
            var output = clc.yellow(errorText);
            return console.log(output);
        }

        // find this file's base directory
        if(!base)
            var base = timber.pkgEnv.basePath(fileName);
        
        // fetch file content
        var data = false;
        try{
            data = fs.readFileSync(fileName, 'utf8');
        }catch(e){}
        if(!data || data.substr(0, 12) === '/*COMPILED*/')
            return;

        // process handlebars
        if(timber.endsWith(fileName, '.handlebars') || timber.endsWith(fileName, '.hbs')) {
            data = handlebars.precompile(handlebars.parse(data));
            return "module.exports = getModule(':handlebars-runtime.js').template(" + data + ")";
        }

        // this is not a JS file, just return it and do NOT parse it
        else if( !timber.endsWith(fileName, '.js') && !timber.endsWith(fileName, '.htm') && !timber.endsWith(fileName, '.html') ) 
            return data;

        // deal with tokens
        while ((match = this.private.identifiers.exec(data)) != null) {

            var pos = match.index;
            
            // add to addPath
            if(data[pos] === '.') {
                var object = new objectParser(data, pos+8);
                var path = timber.pkgEnv.resolvePath(object.strings[1].text, base, this.private.paths);
                if(!timber.endsWith(path, '/'))
                    path = path + '/';
                this.private.paths[object.strings[0].text] = path;

            // handle extends
            }else if(data[pos] === 'e') {
                var object = new objectParser(data, pos+7);
                for(var i in object.strings) {
                    var extendingPath = object.strings[i].text;
                    if(!timber.endsWith(extendingPath, '.js'))
                        extendingPath = extendingPath + '.js';
                    this.private.dependencies.push({
                        file: extendingPath,
                        base: base,
                        requestedBy: fileName
                    });
                }

            }else if(data[pos] === 'g') {
                // parse this string
                var object = new objectParser(data, pos+9);
                // abort if no strings to parse
                if(!object.strings.length)
                    return;
                // filename we extracted
                var moduleLocation = object.strings[0].text;
                // if this is hbs, make sure handlebars is included
                this.includeDependencies(moduleLocation, base, fileName);
                // add this dependencies
                this.private.dependencies.push({
                    file: moduleLocation,
                    base: base,
                    requestedBy: fileName
                });
                
            // requirements
            }else if(data[pos] === 'r') {
                var prependToFile = [];
                var object = new objectParser(data, pos+8);
                for(var i = object.strings.length - 1; i > -1; i--) {
                    var file = object.strings[i];
                    var selector = timber.pkgEnv.moduleSelector(file.text);
                    var moduleLocation = selector.name + '.' + selector.extension;
                    // move local requirements outside of classes
                    if(selector.saveParent === 'local') {
                        data = timber.replaceRange(data, file.startPos, file.endPos - file.startPos + 1, "0");
                        prependToFile.push('var ' + selector.variableName + '=getModule("' + moduleLocation + '");');
                    }

                    // if this is hbs, make sure handlebars is included
                    this.includeDependencies(moduleLocation, base, fileName);
                    
                    // add this requirement to req list
                    this.private.dependencies.push({
                        file: moduleLocation,
                        base: base,
                        requestedBy: fileName
                    });
                }
                data = prependToFile.join('') + data;
            }

        }

        return this.private.fileCache[fileID] = data;
            
    },

    includeDependencies: function(moduleLocation, base, requestedBy) {
        if( timber.endsWith(moduleLocation, '.handlebars') || timber.endsWith(moduleLocation, '.hbs') ) {
            this.private.dependencies.push({
                file: ':handlebars-runtime.js',
                base: base,
                requestedBy: requestedBy
            });
        }        
    }
    
});
