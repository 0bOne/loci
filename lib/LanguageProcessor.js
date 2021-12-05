const fs = require("fs");
const Disambiguator = require("./Disambiguator");
const Filter = require("./RuleFilter");

module.exports = class languageProcessor
{

    _disambiguator;
    _rulesFilter;
    _languages;

    constructor(languages)
    {
        this._languages = languages;
    }

    ProcessFiles(context)
    {
        this._disambiguator = new Disambiguator(this._languages, context.options);
        this._rulesFilter = new Filter(context.options);

        for (const fileInfo of context.files)
        {
            const definition = this._getDefinition(fileInfo, context);
            let statistics = this._rulesFilter.GetStatistics(fileInfo, definition);
            this._mergeStatistics(statistics, definition, context.output);
        }
    }

    _mergeStatistics(statistics, definition, output)
    {
        if (definition)
        {
            switch (definition.type)
            {
                case "SPECIAL":
                    output.files.special ++;
                    statistics = null;
                    break;
                case "AMBIGUOUS":
                    output.files.ambiguous ++;
                    break;
                case "CODE":
                    output.files.recognized++;
                    break;
                default:
                    throw "Unrecognized definition type " + definition.type;
                    break;
            }

            if (statistics)
            {
                if (output.counts[definition.id] === undefined)
                {
                    output.counts[definition.id] = {
                        files: 0,
                        blank: 0,
                        comment: 0,
                        code: 0,
                        total: 0
                    };
                }
                output.counts[definition.id].files ++;
                output.counts[definition.id].blank += statistics.blank;
                output.counts[definition.id].comment += statistics.comment;
                output.counts[definition.id].code += statistics.code;
                output.counts[definition.id].total += statistics.total;
                
            
                output.totals.blank += statistics.blank;
                output.totals.comment += statistics.comment;
                output.totals.code += statistics.code;
                output.totals.lines += statistics.total;    
            }    
            else
            {
                output.files.ignored ++;
            }
        }
        else
        {
            output.files.unrecognized ++;
        }
    }

    _getDefinition(fileInfo, context)
    {
        let languageDefinition = false;

        const specialDefinition = this._searchDefinitions(fileInfo, context.definitions.specials);
        if (specialDefinition)
        {
            specialDefinition.type = "SPECIAL";
            return specialDefinition;
        }

        languageDefinition = this._searchDefinitions(fileInfo, this._languages);
        if (languageDefinition === false)
        {
            //not a language, maybe an ambiguous definition? Those can be resolved into language defs.
            const ambiguousDefinition = this._searchDefinitions(fileInfo, context.definitions.conflicts);
            if (ambiguousDefinition)
            {
                ambiguousDefinition.type = "AMBIGUOUS";
                languageDefinition = this._disambiguator.DetermineDefinition(fileInfo, ambiguousDefinition); 
                if (languageDefinition === false)
                {
                    return ambiguousDefinition;
                }
            }
            else
            {
                languageDefinition = this._searchDefinitions(fileInfo, this._languages);
            }
        }

        if (languageDefinition)
        {
            languageDefinition.type = "CODE"
        }

        return languageDefinition;
    }
    
    _searchDefinitions(fileInfo, definitions)
    {
        //console.log("list", list);

        for(const languageId in definitions)
        {
            const definition = definitions[languageId];
            if (definition["id-by"])
            {
                if (definition["id-by"]["extension"] && fileInfo.extension.length > 0)
                {
                    if (definition["id-by"]["extension"].indexOf(fileInfo.extension) > -1)
                    {
                        return definition;
                    }
                    //check each possible extension for a multi-extension partial
                    for (const ext of definition["id-by"]["extension"])
                    {
                        const extToTest = "." + ext;
                        if (fileInfo.name.endsWith(extToTest) ) //|| extToTest.endsWith("." + fileInfo.extension)
                        {
                            return definition;
                        }
                    }
                }
                if (definition["id-by"]["filename"])
                {
                    //return if file name matches any filenames in the definition, 
                    if (definition["id-by"]["filename"].indexOf(fileInfo.name) > -1)
                    {
                        return definition;
                    }
                }
                if (definition["id-by"]["prefix"])
                {
                    //return if filename starts with any prefixes in the definition
                    for (const prefix of definition["id-by"]["prefix"])
                    {
                        if (fileInfo.name.startsWith(prefix))
                        {
                            return definition;
                        }
                    }
                }
                if (definition["id-by"]["shebang"])
                {
                    //return if first line has a shebang that ends with any in the definition
                    let content = "" + fs.readFileSync(fileInfo.path);
                    content = content.replace("\r\n", "\n").replace("\r", "\n");
                    const lines = content.split("\n");
                    if (this._isShebang(lines[0], definition["id-by"]["shebang"]) || this._isShebang(lines[1], definition["id-by"]["shebang"]))
                    {
                        return definition;             
                    }
                }
            }
        }
        return false;
    }

    _isShebang(line, shebangs)
    {
        if (line.trim().startsWith("#!"))
        {
            const cleanLine = line.split("-")[0].trim();
            for (let shebang of shebangs)
            {
                if (cleanLine.endsWith("/" + shebang))
                {
                    return true;
                }
            }
        }
        return false;
    }

}