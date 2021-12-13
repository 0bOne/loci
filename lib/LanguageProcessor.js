const fs = require("fs");
const Disambiguator = require("./Disambiguator");
const Filter = require("./RuleFilter");
const YamlHelp = require("./YamlHelp");

module.exports = class languageProcessor
{

    _disambiguator;
    _rulesFilter;
    _languages;
    _options;
    _logger;

    constructor(logger, options)
    {
        this._logger = logger;
        this._options = options;
        this._languages = this._loadDefinition("languages.yaml");
        this._specials = this._loadDefinition("special-files.yaml");
        this._conflicts  = this._loadDefinition("ambiguous-files.yaml");

        this._createLanguageOverrideMap();
    }

    _createLanguageOverrideMap()
    {
        //create a map of language definitions overridden by the --langs switch
        if (this._options.langs)
        {
            this._languageOverrides = {};
            for (let langItem of this._options.langs)
            {
                const tokens = langItem.split("=");
                if (tokens.length === 2)
                {
                    const extension = tokens[0];
                    const languageId =  tokens[1];
                    if (this._languages[languageId])
                    {
                        this._languageOverrides[extension] = this._languages[languageId];
                    }
                    else
                    {
                        console.error("Invalid language id in --lang switch: " + languageId);
                        process.exit(1);
                    }
                }
                else
                {
                    console.error("Invalid --lang syntax " + langItem);
                    process.exit(1);
                }
            }
        }
    }

    _loadDefinition(fileName)
    {
        const jsonDoc = YamlHelp.LoadDoc(fileName);
        for (const itemId in jsonDoc)
        {
            jsonDoc[itemId].id = itemId;
        }
        return jsonDoc;
    }

    ProcessFiles(files)
    {
        const output = {
            files: {total: 0, unique: 0, unrecognized: 0, recognized: 0, ambiguous: 0, special: 0, ignored: 0},
            counts: {},
            totals:{lines: 0, blank: 0, code: 0, comment: 0}
        };

        this._disambiguator = new Disambiguator(this._logger, this._languages, this._options);
        this._rulesFilter = new Filter(this._logger, this._options);

        let filesRemaining = files.length;
        for (const fileInfo of files)
        {
            const definition = this._getDefinition(fileInfo);
            let statistics = this._rulesFilter.GetStatistics(fileInfo, definition);
            this._mergeStatistics(statistics, definition, output);
            filesRemaining--;
        }

        return output;
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

    _getDefinition(fileInfo)
    {
        //TODO: clean up this ugly method - too many exit points and return variables
        let languageDefinition = false;

        const specialDefinitionOrOverride = this._searchDefinitions(fileInfo, this._specials, "SPECIAL");
        if (specialDefinitionOrOverride)
        {
            return specialDefinitionOrOverride;
        }

        languageDefinition = this._searchDefinitions(fileInfo, this._languages, "CODE");
        if (languageDefinition === false)
        {
            //not a language, maybe an ambiguous definition? Those can be resolved into language defs.
            const ambiguousDefinition = this._searchDefinitions(fileInfo, this._conflicts, "AMBIGUOUS");
            if (ambiguousDefinition)
            {
                languageDefinition = this._disambiguator.DetermineDefinition(fileInfo, ambiguousDefinition); 
                if (languageDefinition === false)
                {
                    return ambiguousDefinition;
                }
            }
            else
            {
                languageDefinition = this._searchDefinitions(fileInfo, this._languages, "CODE");
            }
        }

        return languageDefinition;
    }
    
    _searchDefinitions(fileInfo, definitions, definitionType)
    {
        if (this._languageOverrides)
        {
            if (this._languageOverrides[fileInfo.extension])
            {
                //overrie is always of type 'CODE' regardless of what is passed in
                this._languageOverrides[fileInfo.extension].type = "CODE";
                return this._languageOverrides[fileInfo.extension];
            }
        }

        for(const languageId in definitions)
        {
            const definition = definitions[languageId];
            if (definition["id-by"])
            {
                if (definition["id-by"]["extension"] && fileInfo.extension.length > 0)
                {
                    if (definition["id-by"]["extension"].indexOf(fileInfo.extension) > -1)
                    {
                        definition.type = definitionType;
                        return definition;
                    }
                    //check each possible extension for a multi-extension partial
                    for (const ext of definition["id-by"]["extension"])
                    {
                        const extToTest = "." + ext;
                        if (fileInfo.name.endsWith(extToTest) ) //|| extToTest.endsWith("." + fileInfo.extension)
                        {
                            definition.type = definitionType;
                            return definition;
                        }
                    }
                }
                if (definition["id-by"]["filename"])
                {
                    //return if file name matches any filenames in the definition, 
                    if (definition["id-by"]["filename"].indexOf(fileInfo.name) > -1)
                    {
                        definition.type = definitionType;
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
                            definition.type = definitionType;
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
                        definition.type = definitionType;
                        return definition;             
                    }
                }
            }
        }
        return false;
    }

    _isShebang(line, shebangs)
    {
        if (line && line.trim().startsWith("#!"))
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