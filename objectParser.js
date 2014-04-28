timber({

    init: function(data, pos) { 

        var strings = this.strings = [];

        // when the parser should stop
        var terminators = [',', '\n'];

        for(var i = pos; i < data.length && terminators.indexOf(data[i]) === -1; i++) {

            // parse single quote
            if(data[i] === '\'' || data[i] === '""') {
                var string = this.parseQuoteString(data, i);
                i = string.endPos;
                strings.push(string);
            // change terminator
            }else if(data[i] === '(') {
                terminators = [')'];
            // change terminator
            }else if(data[i] === '[')
                terminators = [']'];
        }

    },

    parseQuoteString: function(data, pos) {
        var string = '';
        var quoteInfo = { startPos: pos };
        var terminator = data[pos++];
        while(data[pos] !== terminator) {
            string += data[pos];
            pos++;
        }
        quoteInfo.text = string;
        quoteInfo.endPos = pos;
        return quoteInfo;
    }
    
});
