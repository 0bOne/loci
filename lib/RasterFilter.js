const fs = require("fs");
const StopWatch = require("./StopWatch");

const IN_CODE = 1;
const IN_COMMENT = 2;
const IN_STRING = 3

module.exports = class RasterFilter
{
    _options;
    _logger;
    _map;

    //TODO: split into 2 classes, one for initialization, one for raster scan.
    constructor(logger, options, map)
    {
        this._options = options;
        this._logger = logger;
        this._map = map;
    }

    GetStatistics(fileInfo, definition)
    {
        var stopwatch = new StopWatch();

        this._logger.Info("Filtering & Counting " + fileInfo.path);

        var statistics = {
            language: definition.id,
            blank: 0,
            comment: 0,
            code: 0,
            total: 0
        };

        if (definition.tokenBuffers === undefined)
        {
            definition.tokenBuffers = this._getTokens(definition);
        }

        //this._trace("getting statistics via raster scan");
        //TODO: assumss UTF-8, convert from other formats

        var context = {
            content: fs.readFileSync(fileInfo.path),
            statistics: statistics,
            cursor: 0,
            tokens: definition.tokenBuffers,
            in: IN_CODE
        };

        this._resetLineInfo(context);

        this._scan(context);

        //catch last line statistics if no EOL
        this._processLastLine(context);

        this._logger.Debug("\tstatistics are: ", statistics);
        fileInfo.timing.analysis += stopwatch.ElapsedTime();
        return statistics;
    }

    _getTokens(definition)
    {
        var tokens = {
            strings: [],
            comments: [],
            escapes: [],
            eols: [],
            whitespace: []
        };

        tokens.whitespace.push(Buffer.from("\t"));
        tokens.whitespace.push(Buffer.from(" "));
  
        tokens.eols.push(Buffer.from("\r\n"));
        tokens.eols.push(Buffer.from("\n"));
        tokens.eols.push(Buffer.from("\r"));

        if (definition.raster)
        {
            this._addReusedDefinitions(definition);
            
            //second loop, get 
            for(let tokenDef of definition.raster)
            {
                switch(tokenDef.type)
                {
                    case "escape":
                        tokens.escapes.push(Buffer.from(tokenDef.sequence));
                        break;
                    case "string":
                        tokens.strings.push(this._addBuffers(tokenDef, "s"));
                        break;
                    case "comment":
                        tokens.comments.push(this._addBuffers(tokenDef, "r"));
                        break;
                    default:
                        throw "Unsupported token definition: " + tokenDef.type
                }
            }
        }

        this._addDebugChar(tokens.whitespace, "w");
        this._addDebugChar(tokens.eols, "\n");
        this._addDebugChar(tokens.escapes, "e");
  
        return tokens;
    }

    _addReusedDefinitions(definition)
    {
        let newRaster = [];
        let languageIds = [];

        for(let tokenDef of definition.raster)
        {
            if (tokenDef.type === "reuse")
            {
                languageIds.push(tokenDef.sources);
            }
            else
            {
                newRaster.push(tokenDef);
            }
        }

        for (let languageId of languageIds)
        {
            newRaster.push(...this._map.Languages[languageId].raster)
        }

        definition.raster = newRaster;
    }

    _addBuffers(tokenDef, debugChar)
    {
        tokenDef.starts = [];
        tokenDef.ends = [];
        tokenDef.isEOL = false;

        tokenDef.starts.push(Buffer.from(tokenDef.start));
        this._addDebugChar(tokenDef.starts, debugChar);


        if (tokenDef.end === "EOL")
        {
            tokenDef.ends = [];
            tokenDef.isEOL = true;
            tokenDef.ends.push(Buffer.from("\r\n"));
            tokenDef.ends.push(Buffer.from("\n"));
            tokenDef.ends.push(Buffer.from("\r"));
            this._addDebugChar(tokenDef.ends, "\n");
        }
        else
        {
            tokenDef.ends.push(Buffer.from(tokenDef.end));
            this._addDebugChar(tokenDef.ends, debugChar);
        }

        return tokenDef;
    }

    _addDebugChar(buffers, debugChar)
    {
        for(var buffer of buffers)
        {
            buffer.debugChar = debugChar;
        }
    }

    _processLastLine(context)
    {
        if (context.lineInfo.code > 0 ||
            context.lineInfo.comment > 0 ||
            context.lineInfo.whitespace > 0 ||
            context.lineInfo.string > 0 ||
            context.lineInfo.escapes > 0)
        {
            //the last line had characters, but didn't end with an EOL. 
            //send to the EOL function to include those statistics
            this._processEOL(context);
        }
    }

    _scan(context)
    {
        while (context.cursor < context.content.length)
        {
            var oldCursor = context.cursor;

            switch (context.in)
            {
                 case IN_CODE:
                    this._scanCode(context);
                    break;
                case IN_STRING:
                    this._scanString(context);
                    break;
                case IN_COMMENT:
                    this._scanComment(context);
                    break;
                default:
                    throw "Unsupported 'in' value: " + context.in;
            }

            if (oldCursor === context.cursor)
            {
                //ensure scan ends: if none of the above scans advance the cursor, add 1. 
                context.cursor++;
            }
        } 
    }

    _scanCode(context)
    {
        while (context.cursor < context.content.length)
        {
            var oldCursor = context.cursor;

            //start of a string?
            if (this._startingBufferMatchAdvancedCursor(context, context.tokens.strings))
            {
                //no longer scanning code
                context.in = IN_STRING;
                //this._trace("*** STRING START ****");
                return;
            }
            //start of a comment?
            else if (this._startingBufferMatchAdvancedCursor(context, context.tokens.comments))
            {
                context.in = IN_COMMENT;
                //this._trace("*** COMMENT START ****");
                return;   
            }
            //end of line?
            else if (this._anyBufferMatchAdvancedCursor(context, context.tokens.eols))
            {
                //this._trace("*** CODE EOL ****");
                this._processEOL(context);
            }
            //whitespace?
            else if (this._anyBufferMatchAdvancedCursor(context, context.tokens.whitespace))
            {
                //cursor will have adanced the number of matched chars
                //this._trace("*** CODE whitespace ****");
                var numWhiteSpaceChars = context.cursor - oldCursor;
                context.lineInfo.whitespace = numWhiteSpaceChars;
            }
            else 
            {
                //nothing important matched, advance to next position
                //this._advanceCursorWithTrace(context, 1, "+");
                context.cursor ++;
                context.lineInfo.code++;
            }
        }  //until no more buffer
    }

    _scanString(context)
    {
        var endsOnEOL = context.lastStarter.isEOL;
        var isInEscape = false;  //ensure 2 consecutive escapes aren't both escapes

        while (context.cursor < context.content.length)
        {
            var oldCursor = context.cursor;
 
            //end of string?
            if (this._endingBufferMatchAdvancedCursor(context))
            {
                if (endsOnEOL === true)
                {
                    //a string can, in theory, end on an EOL. If it does, the EOL must be processed.
                    //this._trace("*** STRING END/EOL ****");
                    this._processEOL(context);
                }
                else
                {
                    //end-pf-string chars count as string chars
                    //this._trace("*** STRING END ****");
                    //var numChars = (context.cursor - oldCursor);
                    context.lineInfo.string += (context.cursor - oldCursor);
                }
                context.lastStarter = null;
                context.in = IN_CODE;               
                return;
            }
            //end of line?
            else if (this._anyBufferMatchAdvancedCursor(context, context.tokens.eols))
            {
                //this._trace("*** STRING EOL ****");
                this._processEOL(context);
            }  
            //escape character (swallow separately because it could also be an ending sequence)
            else if (isInEscape === false && this._anyBufferMatchAdvancedCursor(context, context.tokens.escapes))
            {
                //this._trace("*** STRING ESCAPE ****");
                isInEscape = true;
                context.lineInfo.escapes ++;
                //this._advanceCursorWithTrace(context, 1, "s");
                context.cursor ++;

            }
            //otherwise just a string character          
            else
            {
                isInEscape = false; 
                context.lineInfo.string ++;
                //this._advanceCursorWithTrace(context, 1, "s");
                context.cursor ++;
            }
        } //until no more buffer
    }

    _scanComment(context)
    {
        var endsOnEOL = context.lastStarter.isEOL;

        while (context.cursor < context.content.length)
        {
            var oldCursor = context.cursor;

            //end of comment?
            if (this._endingBufferMatchAdvancedCursor(context))
            {
                if (endsOnEOL === true)
                {
                    //a comment  can end on an EOL. If it does, the EOL must be processed.
                    //this._trace("*** COMMENT END/EOL ****");
                    this._processEOL(context);
                }
                else
                {
                    //end-of-comment chars count as comment chars
                    //this._trace("*** COMMENT END ****");
                    //var numChars = (context.cursor - oldCursor);
                    context.lineInfo.comment += (context.cursor - oldCursor);
                }
                context.lastStarter = null;
                context.in = IN_CODE;               
                return;
            }
            //end of line (when not an EOL-ended comment, above?
            else if (this._anyBufferMatchAdvancedCursor(context, context.tokens.eols))
            {
                //this._trace("*** COMMENT EOL ****");
                this._processEOL(context);
            }  
            //otherwise just a string character          
            else
            {
                context.lineInfo.comment++;
                //this._advanceCursorWithTrace(context, 1, "r");
                context.cursor ++;
            } 
        }   //until no more buffer    
    }

    _startingBufferMatchAdvancedCursor(context, tokenDefinitions)
    {
        for (var tokenDefinition of tokenDefinitions)
        {
            for (var buffer of tokenDefinition.starts)   
            {
                if (this._bufferMatchAdvanceCursor(context, buffer))
                {
                    context.lastStarter = tokenDefinition;
                    return true;
                }
            }   
        } 
        return false;
    }

    _endingBufferMatchAdvancedCursor(context)
    {

        for (var buffer of context.lastStarter.ends)   
        {
            if (this._bufferMatchAdvanceCursor(context, buffer))
            {
                context.lastStarter = null;
                return true;
            }
        }  
        return false;
    }

    _anyBufferMatchAdvancedCursor(context, buffers)
    {
        for (var buffer of buffers)   
        {
            if (this._bufferMatchAdvanceCursor(context, buffer))
            {
                return true;
            }
        }  
        return false;
    }

        //advances cursor if buffer matches
    _bufferMatchAdvanceCursor(context, buffer)
    {
        for (var offset = 0; offset < buffer.length; offset++)
        {
            if (context.content[context.cursor + offset] !== buffer[offset])
            {
                return false;
            }
        }

        //match achieved. advance the cursor and return true   
        //this._advanceCursorWithTrace(context, buffer.length, buffer.debugChar);
        context.cursor += buffer.length;
        return true;
    }

    _advanceCursorWithTrace(context, amount, debugChar)
    {   
        for (var i = 0; i < amount; i++)
        {
            var advancedChar = String.fromCharCode(context.content[context.cursor]);
            context.lineInfo.debug1 += advancedChar;
            context.lineInfo.debug2 += debugChar;

            if (advancedChar === "\n")
            {
                advancedChar = "\\n";
            }
            else if (advancedChar === "\r")
            {
                advancedChar = "\\r";
            }
            else if (advancedChar === " ")
            {
                advancedChar = "[ ]";
            }
            else if (advancedChar === "\t")
            {
                advancedChar = "\\t";
            }

            //this._trace("advancing cursor from " + context.cursor + ": " + advancedChar + "\t" + debugChar);
            context.cursor++;
        }
    }

    _resetLineInfo(context)
    {
        context.lineInfo = {
            code: 0,
            comment: 0,
            whitespace: 0,
            string: 0,
            debug1: "",
            debug2: ""
        };
    }

    _processEOL(context)
    {
        if (context.lineInfo.code > 0 ||
            context.lineInfo.string > 0 ||
            context.lineInfo.escapes > 0)
        {
            //any of these in a line means it should be counted as a line of code
            context.statistics.code ++;
        }
        else if (context.lineInfo.comment > 0)
        {
            //any comment characters when no lines of code make it a comment line
            context.statistics.comment ++;
        }
        else 
        {
            //anything else is treated as a blank line
            context.statistics.blank ++;
        }

        context.statistics.total ++;

        //this._trace("debug line:  " + context.lineInfo.debug1);
        //this._trace("debug chars: " + context.lineInfo.debug2);

        this._resetLineInfo(context);
    }

    // eslint-disable-next-line no-unused-vars
    _trace(message)
    {
        //console.log(message);
    }
}