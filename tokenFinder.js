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
    
    nextToken: function() {
        if(this.private.pos >= this.private.data.length)
            return -1;
        else
            return this.private.data[this.private.pos];
    },

    consumeToken: function() {
        return this.private.data[this.private.pos++];
    },

    /* parser functions */
    
    parseStart: function() {
        var c = this.nextToken();
        if(c == 'r') {
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
        }else if(c == '/') {
            this.parseComment();
            this.parseStart();
        }else if(c != -1) {
            this.consumeToken();
            this.parseStart();
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
