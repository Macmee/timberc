timber({

    private: {
        pos: 0
    },
    
    init: function(data) {
        this.private.data = data;
        this.parseStart();
    },
    
    /* tokenizing */
    
    nextToken: function(len, disableWhiteSpaceRemover) {
        if(!len)
            len = 1;
        if(this.private.pos >= this.private.data.length)
            return -1;
        else{
            if(!disableWhiteSpaceRemover)
                this.skipWhitespace();
            var token = this.private.data.substr(this.private.pos, len);
            return token;
        }
    },

    nextTokenEquals: function(str) {
        return this.nextToken(str.length) === str;
    },
    
    skipWhitespace: function() {

        var data = this.private.data;
        var pos = this.private.pos;
        
        // first get rid of whitespace
        while( pos <= data.length && (data[pos] === ' ' || data[pos] === "\t" || data[pos] === "\n")  )
            pos++;

        // then check if we hit a comma
        if(data[pos] == '/') {
            if(data[pos++] == '/') {
                while(pos < data.length && data[pos++] != '\n');
            }else{
                while(pos++ < data.length && data[pos] != '*' && data[++pos] != '/');
            }

            this.private.pos = pos;

            return this.skipWhitespace();
            
        }

        this.private.pos = pos;
        
    },

    consumeToken: function(len, disableWhiteSpaceRemover) {
        if(!len)
            len = 1;
        else if(typeof len == 'string')
            len = len.length;
        var current = this.nextToken(len);
        if(!disableWhiteSpaceRemover)
            this.skipWhitespace();
        this.private.pos += len;
        return current;
    },

    /* parser functions */
    
    parseStart: function() {
        var c = this.nextToken();
        // string
        if(c == '"' || c == "'") {
            this.parseString();
            this.parseStart();
            // timber
        }else if( (c == 't' && this.nextTokenEquals('timber(')) || (c == 't' && this.nextTokenEquals('.extends(')) ) {
            this.parseTimber();
            this.parseStart();
        }else if(c == '.' && this.nextTokenEquals('.addPath(')) {
            this.parseAddPath();
            this.parseStart();
        }else if(c == 'g' && this.nextTokenEquals('getModule(')) {
            this.parseGetModule();
            this.parseStart();
            // *
        }else if(c != -1) {
            this.consumeToken();
            this.parseStart();
        }
    },

    parseCurlyBrace: function() {
        var c = this.consumeToken(); // ditch the {
        while( (c = this.nextToken()) !== '}' ) {
            // brace
             if(c == '{') {
                this.parseCurlyBrace();
                // string
            }else if(c == '"' || c == "'") {
                this.parseString();
            // something strange happened
            }else if(c == -1) {
                return console.log('unclosed { tag!');
            }else{
                this.consumeToken();
            }
        }
        this.consumeToken();
    },

    parseTimber: function() {
        var startLength = this.nextToken(7) == 'timber(' ? 7 : 9; // determine if this is .extends or timber(
        // remove {
        this.consumeToken(startLength);
        // loop until we hit the end
        var c = this.consumeToken(); // ditch the {
        while( (c = this.nextToken()) !== '}' ) {
            // brace
            if(c == '{') {
                this.parseCurlyBrace();
            // string
            }else if(c == '"' || c == "'") { 
                this.parseString();
            }else if(c == 'r' && this.nextTokenEquals('requires:')) {
                this.parseRequires();
            }else if(c == '.' && this.nextTokenEquals('.addPath(')) {
                this.parseAddPath();
            }else if(c == 'g' && this.nextTokenEquals('getModule(')) {
                this.parseGetModule();
            }else if(c == 'e' && this.nextTokenEquals('extends:')) {
                this.parseExtends();
            // something strange happened
            }else if(c == -1) { 
                return console.log('unclosed tag'); 
            }else{
                this.consumeToken();
            }
        }
    },

    parseString: function() {
        var terminator = this.private.data[this.private.pos++];
        var c;
        var str = [];
        while((c = this.private.data[this.private.pos++]) !== terminator && c != -1) {
            if(c == '\\') {
                str.push(this.private.data[this.private.pos++]);
            }else{
                str.push(c);
            }
        }
        return str.join('');
    },

    parseStringList: function() {
        if( this.nextTokenEquals('\'') || this.nextTokenEquals('"') ) {
            return [ this.parseString() ];
        }else if(this.nextTokenEquals('[')) {
            this.consumeToken();
            var stringList = this.parseStringListFragment([]);            
            if(this.consumeToken() !== ']')
                console.log('You did not close a list of strings properly!');
            return stringList;
        }
    },

    parseStringListFragment: function(list) {
        var c = this.nextToken();
        if(c == '"' || c == "'") {
            list.push(this.parseString());
            return this.parseStringListFragment(list);
        }else if(c == ',') {
            this.consumeToken();
            return this.parseStringListFragment(list);
        }else{
            return list;
        }
        
    },

    parseRequires: function() {
        this.consumeToken('requires:');
        var strings = this.parseStringList();
        console.log('requires', strings);
    },

    parseAddPath: function() {
        this.consumeToken('.addPath(');
        var name = this.parseString(); console.log(name);
        this.consumeToken();       
        var path = this.parseString(); console.log(path);
        this.consumeToken();
    },

    parseExtends: function() {
        this.consumeToken('extends:');
        var strings = this.parseStringList();
        console.log('extends', strings);
    },

    parseGetModule: function() { console.log('getModule')
        this.consumeToken();
    }
    
});
