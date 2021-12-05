const CodeScorer = require("./CodeScorer");
const Filter = require("./RuleFilter");

module.exports = class Disambiguator
{ 
    _languages;
    _filter;
    constructor (languages, options)
    {
        this._languages = languages;
        this._filter = new Filter(options);
    }

    DetermineDefinition(fileInfo, definition)
    {            
        if (definition && definition["scoring-rules"])
        {
            const scorer = new CodeScorer(this._languages);
              
            const lines = this._filter.GetFilteredLines(fileInfo, definition);

            this._initialize(scorer, definition);
            this._processRules(scorer, definition, lines);

            const winningDefinition = scorer.GetWinningDefinition();
            if (winningDefinition == false)
            {
                console.log("could not disambiguate " + fileInfo.path);
            }
            return winningDefinition;
        }
        console.log("no rules in " + fileInfo.path);
        return false;
    }

    _initialize(scorer, definition)
    {
        //start with zero for all languages
        for(let rule of definition["scoring-rules"])
        {
            rule.processed = false;
            this._generateCachedRegex(rule);
            scorer.ResetToZero(rule["for"]);
        }
    }

    _processRules(scorer, definition, lines)
    {
        //apply line by line rules
        for (let line of lines)
        {            
            for(let rule of definition["scoring-rules"])
            {
                if (rule.method === "bias" && rule.processed === true)
                {
                    continue;
                }

                switch (rule.method)
                {
                    case "bias":
                        //typically this is accompanied by a when='once' to bias the score at the start 
                        scorer.ResetToZero(rule.for);
                        scorer.IncrementPoints(rule.for, rule.points);
                        break;
                    case "match":
                        if (rule.expression.test(line))
                        {
                            scorer.IncrementPoints(rule.for, rule.points);
                            if (rule["skip-subsequent"] === "rules")
                            {
                                break;
                            }
                            if (rule["skip-subsequent"] === "lines")
                            {
                                return;
                            }
                        }
                        break;
                    default: 
                        throw "Unrecognized rule method " + rule.method + " in " + definition.id;
                }
                rule.processed = true;
            } //each rule
        } //each line 
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
}