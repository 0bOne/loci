const fs = require("fs");
const path = require("path");
const jp = require('jsonpath');
const StringHelpers = require("./StringHelpers");
const StopWatch = require("./StopWatch");

module.exports = class RuleFilter
{

    _options;
    _logger;

    constructor(logger, options)
    {
        this._options = options;
        this._logger = logger;
    }


    GetStatistics(fileInfo, definition)
    {
        const stopwatch = new StopWatch();

        this._logger.Info("Filtering & Counting " + fileInfo.path);

        let content = fileInfo.ReadAllText();
        content = this._normalizeNewlines(content);
        let lines = content.split("\n");

        const statistics = {
            language: ((definition) ? definition.id : null) ?? "unknown",
            blank: 0,
            comment: 0,
            code: lines.length,
            total: lines.length
        }

        lines = this._removeBlanks(lines);
        statistics.blank = statistics.total - lines.length;

        let preFilterCount = lines.length;

        content = lines.join("\n");

        content = this._applyFilters(content, definition, fileInfo);

        lines = content.split("\n");

        //remove blank lines caused by comment replacement
        lines = this._removeBlanks(lines); 
        
        statistics.comment = preFilterCount - lines.length;
        statistics.code = lines.length;

        this._logger.Debug("\tstatistics are: ", statistics);

        fileInfo.timing.analysis += stopwatch.ElapsedTime();
         
        return statistics;
    }
    
    GetFilteredLines(fileInfo, definition)
    {
        let content = fileInfo.ReadAllText();
        content = this._normalizeNewlines(content);
        let lines = content.split("\n");
        lines = this._removeBlanks(lines);
        content = this._applyFilters(content, definition, fileInfo);
        lines = content.split("\n");
        return lines;
    }

    _normalizeNewlines(content)
    {
        content = StringHelpers.ReplaceEvery(content, "\r\n", "\n");
        content = StringHelpers.ReplaceEvery(content, "\r", "\n");
        if (content.endsWith("\n"))
        {
            content = content.substr(0, content.length - 1);
        }
        return content;
    }

    _removeBlanks(lines)
    {
        const linesToKeep = [];
        for (let line of lines)
        {
            let trimmedLine = StringHelpers.ReplaceEvery(line, "\t", "").trim();
            if (trimmedLine.length > 0)
            {
                linesToKeep.push(line);
            }
        }
        return linesToKeep;
    }

    _applyFilters(content, definition, fileInfo)
    {
        if (content && content.length > 0)
        {
            const filters = ((definition) ? definition["filters"] : null) ?? [];

            if (filters.length > 0)
            {   
                let filterNumber = 0; 
                for (let filter of filters)
                {
                    filter.number = filterNumber++;
                    this._generateCachedRegex(filter); //applies to any filter with .pattern attribute
                    this._debugSave(fileInfo, content, definition, filter, "before");

                    try
                    {
                        content = this._applyFilter(content, filter, definition)
                    }
                    catch(e)
                    {
                        if (filter.method === "quit-unless")
                        {
                            break; //no more filters
                        }
                        else
                        {
                            console.error("Exception applying filter " + filter.method + " in definition " + definition.id + "\r\n" + e);
                            console.error("\t in file " + fileInfo.path);
                        }
                    }

                    this._debugSave(fileInfo, content, definition, filter, "after");

                } //for each filter rule
            }
        }

        return content;
    }

    _applyFilter(content, filter, definition)
    {
        switch(filter.method)
        {
            case "remove":
                content = StringHelpers.ReplaceEvery(content, filter.expression, "");
                break;
            case "replace":
                content = StringHelpers.ReplaceEvery(content, filter.expression, filter.with);
                break;
            case "remove-between":
                content = StringHelpers.InclusiveRemoveBetween(content, filter.lhs, filter.rhs);
                break;
            case "remove-between-regex":
                content = this._removeBetweenRegex(content, filter);
                break  
            case "remove-lines-between":
                content = this._removeLinesBetween(content, filter);
                break;
            case "remove-outside-block":
                content = this._removeOutsideBlock(content, filter);
                break;
            case "mask-in-strings":
                content = this._maskInStrings(content, filter);
                break;
            case "mask-in-comment-blocks":
                content = this._maskInCommentBlocks(content, filter);
                break;  
            case "count-only-matches":
                content = this._countOnly(content, filter);
                break;
            case "remove-above":
                content = this._removeAbove(content, filter);
                break;
            case "remove-indented-block":
                content = this._indentedBlockFilter(content, filter);
                break;
            case "json-keep":
                content = this._jsonKeep(content, filter);
                break;
            case "quit-unless":
                this._generateCachedRegex(filter);
                if (filter.expression.test(content) === false)
                {
                    throw "quitting filter set";
                }
                break;
            default:
                throw "unrecognized filter method " + filter.method + " in " + definition.id;
        } 
        return content;
    }

    _debugSave(fileInfo, content, definition, filter, when)
    {
        if (this._options.debugFolder && definition['debug-save'] === true)
        {
            let lines = content.split("\n")
            lines = this._removeBlanks(lines);
            const lineCount = lines.length;

            const fileName = path.basename(fileInfo.path) + "-" + filter.method + "-" + filter.number + "-" + when + "-(" + lineCount + " lines).txt";
            const fileSpec = path.join(this._options.debugFolder, fileName);
            fs.writeFileSync(fileSpec, content);
        }
    }

    _countOnly(content, filter)
    {
        const matches = content.matchAll(filter.expression);
        const newContent = [...matches].join("\n");
        if (filter.forgiving === true && newContent.length === 0)
        {
            return content;
        }
        return newContent;
    }

    _removeAbove(content, filter)
    {
        const match = content.match(filter.expression);
        if (match)
        {
            const pos = content.indexOf(match[0]);
            content = content.substr(pos);
        }
        return content;
    }

    _maskInStrings(content, filter)
    {
        //process for all combinations of escape chars, comments, and quote sequences.
        let escapeChars = filter.escapes || ["\\"]; //default to one escape char: backslash

        for (let escapeChar of escapeChars)
        {
            for (let quoteSequence of filter.quotes)
            {
                for (let toMaskSequence of filter.targets)
                {
                    content = StringHelpers.MaskWithinStrings(content, quoteSequence, toMaskSequence, escapeChar);
                }
            }
        }
        return content;
    }

    _maskInCommentBlocks(content, filter)
    {
        for (let targetSequence of filter.targets)
        {
            content = StringHelpers.MaskWithinCommentBlocks(content, filter.start, filter.end, targetSequence);
        } 
        return content;
    }

    _indentedBlockFilter(content, filter)
    {
        const lines = content.split("\n");
        const linesToKeep = [];

        let startingIndent = 0;
        for (let line of lines)
        {
            let lineToTest = StringHelpers.ReplaceEvery(line, "\t", "    ");
            if (startingIndent > 0)
            {
                let indent = StringHelpers.SpacePrefixCount(lineToTest);
                if (indent < startingIndent)
                {
                    //returned to code
                    linesToKeep.push(line);
                    startingIndent = 0;
                }
                //else still in a comment - don't keep
            }
            else 
            {
                const matchedCommentStart = lineToTest.match(filter.expression);
                if (matchedCommentStart && matchedCommentStart[0])
                {
                    //starting a block
                    startingIndent = StringHelpers.SpacePrefixCount(lineToTest) + 1;
                }
                else
                {
                    //not indented and not a block start. keep.
                    linesToKeep.push(line);
                }      
            }
        }

        content = linesToKeep.join("\n");
        return content;
    }

    _removeLinesBetween(content, filter)
    {
        //look for a line that starts with top
        //followed by a line that starts with bottom

        const topPos = content.indexOf(filter.top);
        if (topPos > -1)
        {
            const bottomPos = content.indexOf(filter.bottom, topPos + 1);
            if (bottomPos > 1)
            {
                //we know the tokens exist in the correct order so we can split into lines and continue
                const lines = content.split("\n");
                const linesToKeep = [];
                let betweenTokens = false;
                for (let line of lines)
                {
                    if (betweenTokens === false && line.trim().startsWith(filter.top))
                    {
                        betweenTokens = true;
                    }
                    else if (betweenTokens === true && line.trim().startsWith(filter.bottom))
                    {
                        betweenTokens = false;
                    }
                    else if (betweenTokens === false)
                    {
                        linesToKeep.push(line);
                    }

                }
                content = linesToKeep.join("\n");
            }
        }
        
        return content;
    }

    _removeOutsideBlock(content, filter)
    {
        //keeps only code blocks. lines before the start, after the end, or between end/start are discarded.
        //can be inclusive or exclusive, and should be able to replace all the above/below combinations.
        const linesToKeep = [];
        const lines = content.split("\n");

        let in_keep_block = false;

        for (let line of lines)
        {
            if (in_keep_block === true && line.startsWith(filter.end))
            {
                in_keep_block = false;
                if (filter.inlusive === true)
                {
                    linesToKeep.push(line);
                }
            }
            else if (in_keep_block === false && line.startsWith(filter.begin))
            {
                in_keep_block = true;
                if (filter.inclusive === true)
                {
                    linesToKeep.push(line);
                }
            }
            else if (in_keep_block === true)
            {
                linesToKeep.push(line);
            }
        }

        if (linesToKeep.length > 0 && linesToKeep.length < lines.length)
        {
            content = linesToKeep.join("\n");
        }

        return content;
    }

    _generateCachedRegex(filter)
    {
        if (filter.pattern && filter.expression === undefined)
        {            
            //create and cache the regex
            let flags = filter.flags || "";
            flags += (flags.indexOf("g") == -1) ? "g": ""; //add global flag if not in defined filter
            filter.expression = new RegExp(filter.pattern, flags);
        }
    } 

    _removeBetweenRegex(content, filter)
    {
        //^\.\.
        //^[^ \n\t\r\f\.]
        let flags = filter.flags || "";
        flags += (flags.indexOf("g") == -1) ? "g": ""; //add global flag if not in defined filter

        const leftExpression = new RegExp(filter.lhs, flags);
        const rightExpression = new RegExp(filter.rhs, flags);

        let cursor = 0;

        const always = true;
        while (always)
        {    
            let leftMatches = content.matchAll(leftExpression);
            let firstLeftMatchFromCursor;
            let leftMatch = leftMatches.next();
            while (leftMatch && leftMatch.value)
            {
                if (leftMatch.value.index >= cursor)
                {
                    firstLeftMatchFromCursor = leftMatch;
                    break;
                }
                leftMatch = leftMatches.next();
            }

            if (firstLeftMatchFromCursor)
            {
                cursor = firstLeftMatchFromCursor.value.index;
                const rightMatches = content.matchAll(rightExpression);
                let rightMatch = rightMatches.next();
                let firstRightMatchAfterLeft = null;
                let rightPos;
                while (rightMatch && rightMatch.value)
                {
                    rightPos = rightMatch.value.index;
                    if (rightPos > cursor + firstLeftMatchFromCursor.value[0].length)
                    {
                        firstRightMatchAfterLeft = rightMatch;
                        break;
                    }
                    rightMatch = rightMatches.next();
                }      

                if (firstRightMatchAfterLeft)
                {
                    const leftPart = content.substr(0, cursor);
                    const rightPart = content.substr(rightPos + rightMatch.value[0].length);
                    content = leftPart + rightPart;
                }  
                else
                {
                    //no right match after cursor. truncate content to left part and exit
                    content = content.substr(0, cursor);
                    break;
                }    
            }
            else
            {
                //no left match after cursor. exit the loop
                break;
            }
        }   //loop
        return content;
    
    }

    _jsonKeep(content, filter)
    {
        //presumes the code to be a valid json document.
        //keeps only the nodes specified by the filter's j-path property

        //no need for try-catch on invalid json, all filters are trapped, having no effect if thrown
        const jDoc = JSON.parse(content);
        const jsonPath = filter['j-path'];
        let toKeep = jp.query(jDoc, jsonPath);
        if (toKeep.length > 0)
        {
            if (filter.root)
            {
                const newRootDoc = {}
                newRootDoc[filter.root] = toKeep;
                toKeep = newRootDoc;
            }           
            content = JSON.stringify(toKeep, null, 2);
        } //else no items matched query. return unfiltered content
        return content;
    }

}