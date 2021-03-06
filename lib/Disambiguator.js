const CodeScorer = require("./CodeScorer");
const Filter = require("./RuleFilter");
const StopWatch = require("./StopWatch");

module.exports = class Disambiguator
{ 
    _languages;
    _filter;
    _logger;
    _stopWatch;

    constructor (logger, options, languages)
    {
        this._logger = logger;
        this._languages = languages;
        this._filter = new Filter(logger, options);
    }

    DetermineDefinition(fileInfo)
    {   
        let stopWatch = new StopWatch();
            
        if (fileInfo.definition && fileInfo.definition["scoring-rules"])
        {
            this._logger.Info("**Disambiugating** " + fileInfo.path);
            const scorer = new CodeScorer(this._languages);
              
            const lines = this._filter.GetFilteredLines(fileInfo, fileInfo.definition);

            this._initialize(scorer, fileInfo.definition);
            this._processRules(scorer, fileInfo.definition, lines, fileInfo);

            const winningDefinition = scorer.GetWinningDefinition();
            if (winningDefinition == false)
            {
                this._logger.Debug("\tcould not disambiguate code");
            }
            this._logger.Debug("\tdisambiugated to " + winningDefinition.id);
            return winningDefinition;
        }

        fileInfo.timing.disambiguation += stopWatch.ElapsedTime();

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

    _processRules(scorer, definition, lines, fileInfo)
    {
        //apply line by line rules
        for (let line of lines)
        {            
            for(let rule of definition["scoring-rules"])
            {
                let exit_rules = false;
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
                                exit_rules = true;
                            }
                            if (rule["skip-subsequent"] === "lines")
                            {
                                return;
                            }
                        }
                        break;
                    case "shebang":
                        if (rule.value === fileInfo.GetShebang())
                        {
                            scorer.IncrementPoints(rule.for, rule.points);
                            break;
                        }
                        break;
                    default: 
                        throw "Unrecognized rule method " + rule.method + " in " + definition.id;
                }
                if (exit_rules)
                {
                    break;
                }
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