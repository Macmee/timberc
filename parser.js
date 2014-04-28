timber({

    requires: ['fs', 'objectParser', 'node_modules/httpsync', ':handlebars', 'node_modules/cli-color clc'],

    private: {
        paths: {},
        dependencies: [],
        identifiers: /requires:|\.addPath\(|extends:/gm,
        fileCache: {}
    },
    
 init: function(saveTo, homeDir) {

        this.private.homeDir = homeDir;
     
        process.chdir(homeDir);

        this.transverseProject('');

        var output = this.buildDependencies();

        this.saveDependencies(saveTo, output);

    },

    saveDependencies: function(saveTo, output) {
        var saveLocation = timber.pkgEnv.resolvePath(saveTo, this.private.homeDir);
        fs.writeFile(saveTo, output.join(''), function(err) {
            if(err) {
                console.log(err);
            } else {
                var output = clc.green('Compiled to "' + saveLocation + "\"");
                console.log(output);
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
            var code = this.processFile(filePath);

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
    transverseProject: function(dir) {

        var files = fs.readdirSync(dir ? dir : '.');
        for(var i in files) {
            var path = dir + files[i];
            if(fs.lstatSync(path).isDirectory()) {
                this.transverseProject(path + '/');
            }else if(timber.endsWith(path, '.js')) {
                this.processFile(path, dir);
            }
        }
    },

    processFile: function(fileName, base) {

        // web resources 
        if(fileName.substr(0, 4) === 'http')
            return httpsync.get(fileName).end().data.toString();        
        
        // only allow processFile to run once per file
        var fileID = fs.lstatSync(fileName).ino;
        if(this.private.fileCache[fileID])
            return this.private.fileCache[fileID];

        // find this file's base directory
        if(!base)
            var base = timber.pkgEnv.basePath(fileName);
        
        // fetch file content
        var data = false;
        try{
            data = fs.readFileSync(fileName, 'utf8');
        }catch(e){}
        if(!data)
            return;

        // process handlebars
        if(timber.endsWith(fileName, '.handlebars') || timber.endsWith(fileName, '.hbs')) {
            data = handlebars.precompile(handlebars.parse(data));
            return "module.exports = getModule(':handlebars-runtime.js').template(" + data + ")";
        }

        // this is not a JS file, just return it and do NOT parse it
        else if(!timber.endsWith(fileName, '.js'))
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
                        base: base
                    });
                }

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
                    this.private.dependencies.push({
                        file: ':handlebars-runtime.js',
                        base: base
                    });
                    // add this requirement to req list
                    this.private.dependencies.push({
                        file: moduleLocation,
                        base: base
                    });
                }
                data = prependToFile.join('') + data;
            }

        }

        return this.private.fileCache[fileID] = data;
            
    }
    
});
