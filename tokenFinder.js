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
            var token = this.private.data.substr(this.private.pos, len);
            if(token.trim() == '') {
                this.consumeToken();
                return this.nextToken();
            }
            return token;
        }
    },

    consumeToken: function(len) {
        if(!len)
            len = 1;
        var current = nextToken(len);
        this.private.pos += len;
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
        }else if(this.nextToken(7) == 'timber(' || this.nextToken(7) == '.extends(') {
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
        console.log('timber found at', this.private.pos);
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
