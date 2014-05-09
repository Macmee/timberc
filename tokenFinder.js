timber({

    private: {
        pos: 0
    },
    
    init: function(data) {
        this.private.data = data;
        this.parseStart();
    },

    /* string matching */

    stringMatchesNextTokens: function(str) {
        
    },
    
    /* tokenizing */
    
    nextToken: function(len) {
        if(!len)
            len = 1;
        if(this.private.pos >= this.private.data.length)
            return -1;
        else{
            this.skipWhitespace();
            var token = this.private.data.substr(this.private.pos, len);
            return token;
        }
    },

    skipWhitespace: function() {
        while( this.private.data[this.private.pos] === ' ' || this.private.data[this.private.pos] === "\t" );
            this.private.pos++;
    },

    consumeToken: function(len) {
        if(!len)
            len = 1;
        var current = this.nextToken(len);
        this.skipWhitespace();
        this.private.pos += len;
        this.skipWhitespace();
        return current;
    },

    /* parser functions */
    
    parseStart: function() {
        var c = this.nextToken();
        // comment
        if(c == '/') {
            this.parseComment();
            this.parseStart();
            // string
        }else if(c == '"' || c == "'") {
            this.parseString();
            this.parseStart();
        // timber
        }else if(this.nextToken(7) == 'timber(' || this.nextToken(9) == '.extends(') {
           this.parseTimber();
           this.parseStart();
        // *
        }else if(c != -1) {
           this.consumeToken();
           this.parseStart();
        }

        /*else if(c == 'r') {
            this.parseRequires();
            this.parseStart();
        }else if(c == '.') {
            this.parseAddPath();
            this.parseStart();
        }else if(c == 'e') {
            this.parseExtends();
            this.parseStart();
        }else if(c == 'g') {
            this.parseGetModule();
            this.parseStart();
        }*/
    },

    parseTimber: function() {
        var startPos = this.nextToken(7) == 'timber(' ? 7 : 9; // determine if this is .extends or timber(
        // remove {
        this.consumeToken();
        this.parseTimberInner();
        // remove })
        if(this.consumeToken() !== '}' || this.consumeToken() !== ')')
            console.log('timber missing closing paren');
        console.log('timber found at', this.private.pos, this.private.data[this.private.pos + startPos]);
    },

    parseCurlyBrace: function() {
        var c = this.consumeToken(); // ditch the {
        while( (c = this.consumeToken()) !== '}' ) {
            // comment
            if(c == '/') {
                this.parseComment();
            }else if(c == '{') {
                this.parseCurlyBrace();
                // string
            }else if(c == '"' || c == "'") {
                this.parseString();
            // something strange happened
            }else if(c == -1) {
                return console.log('unclosed { tag!');
            }
        }

    },

    parseTimberInner: function() {
        var c = this.nextToken();
        // comment
        if(c == '/') {
            this.parseComment();
            this.parseTimberInner();
        }else if(c == '{') {
            this.parseCurlyBrace();
            this.parseTimberInner();
        // string
        }else if(c == '"' || c == "'") {
            this.parseString();
            this.parseTimberInner();
        // timber
        }else if(this.nextToken(7) == 'timber(' || this.nextToken(9) == '.extends(') {
           this.parseTimber();
           this.parseTimberInner();
        // *
        }else if(c != -1) {
           this.consumeToken();
           this.parseTimberInner();
        }
    },

    parseString: function() {
        var terminator = this.consumeToken();
        var c;
        while((c = this.consumeToken()) !== terminator) {
            if(c == '\\')
                this.consumeToken();
        }
    },
    
    parseComment: function() {
        this.consumeToken();
        var c = this.nextToken();
        if(c == '*') { // multiline
            while( (c = this.consumeToken()) != -1 ) {
                if(c == '*' && this.nextToken() == '/') {
                    this.consumeToken();
                    break;
                }
            }
        }else if(c == '/') { // singleline
            while( (c = this.consumeToken()) != -1 ) {
                if(c == '\n') {
                    break;
                }
            }
        }
    },

    parseRequires: function() {
        this.consumeToken();
    },

    parseAddPath: function() {
        this.consumeToken();
    },

    parseExtends: function() {
        this.consumeToken();
    },

    parseGetModule: function() {
        this.consumeToken();
    }
    
});
