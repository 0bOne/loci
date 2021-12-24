const Disambiguator = require("./Disambiguator");
const Filter = require("./RuleFilter");
const YamlHelp = require("./YamlHelp");

const TYPE_CODE = "CODE";
const TYPE_SPECIAL = "SPECIAL";
const TYPE_AMBIGUOUS = "AMBIGUOUS";

module.exports = class languageProcessor
{

    _disambiguator;
    _rulesFilter;
    _languages;
    _options;
    _logger;

    constructor(logger, options)
    {
        BigInt.prototype.toJSON = function() { return this.toString(); };

        this._logger = logger;
        this._options = options;
        this._languages = this._loadDefinition("languages.yaml", TYPE_CODE);
        this._specials = this._loadDefinition("special-files.yaml", TYPE_SPECIAL);
        this._conflicts  = this._loadDefinition("ambiguous-files.yaml", TYPE_AMBIGUOUS);

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

    _loadDefinition(fileName, definitionType)
    {
        const jsonDoc = YamlHelp.LoadDoc(fileName);
        for (const itemId in jsonDoc)
        {
            jsonDoc[itemId].id = itemId;
            jsonDoc[itemId].type = definitionType;
        }
        return jsonDoc;
    }

    ProcessFiles(files)
    {
        const output = {
            files: {total: 0, unique: 0, unrecognized: 0, recognized: 0, ambiguous: 0, special: 0, ignored: 0},
            counts: {},
            timing: {analysis: 0n, disambiguation: 0n},
            totals:{lines: 0, blank: 0, code: 0, comment: 0}
        };

        this._disambiguator = new Disambiguator(this._logger, this._languages, this._options);
        this._rulesFilter = new Filter(this._logger, this._options);

        let filesRemaining = files.length;
        for (const fileInfo of files)
        {
            this._logger.Thread("examining file", fileInfo.path);
            this._logger.ThreadProgress("Counting. To do: ", filesRemaining);
            const definition = this._getDefinition(fileInfo);
            if (definition === false)
            {
                output.files.unrecognized++;
            }
            else if (definition.type === TYPE_SPECIAL || definition.id === "unknown")
            {
                output.files.special++;
            }
            else
            {
                let statistics = this._rulesFilter.GetStatistics(fileInfo, definition);
                this._mergeStatistics(statistics, definition, output, fileInfo);
            }
            filesRemaining--;
        }

        return output;
    }

    _mergeStatistics(statistics, definition, output, fileInfo)
    {

        if (fileInfo.timing)
        {
            output.timing.analysis += fileInfo.timing.analysis;
            output.timing.disambiguation += fileInfo.timing.disambiguation;
        }

        if (definition)
        {
            switch (definition.type)
            {
                case TYPE_SPECIAL:
                    output.files.special ++;
                    statistics = null;
                    break;
                case TYPE_AMBIGUOUS:
                    output.files.ambiguous ++;
                    break;
                case TYPE_CODE:
                    output.files.recognized++;
                    break;
                default:
                    throw "Unrecognized definition type " + definition.type;
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
                        total: 0,
                        analysis: 0n,
                        disambiguation: 0n
                    };
                }
                output.counts[definition.id].files ++;
                output.counts[definition.id].blank += statistics.blank;
                output.counts[definition.id].comment += statistics.comment;
                output.counts[definition.id].code += statistics.code;
                output.counts[definition.id].total += statistics.total;
                
                output.counts[definition.id].analysis += fileInfo.timing.analysis;
                output.counts[definition.id].disambiguation += fileInfo.timing.disambiguation;
            
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

        const specialDefinitionOrOverride = this._searchDefinitions(fileInfo, this._specials);
        if (specialDefinitionOrOverride)
        {
            return specialDefinitionOrOverride;
        }

        languageDefinition = this._searchDefinitions(fileInfo, this._languages);
        if (languageDefinition === false)
        {
            //not a language, maybe an ambiguous definition? Those can be resolved into language defs.
            const ambiguousDefinition = this._searchDefinitions(fileInfo, this._conflicts);
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
                languageDefinition = this._searchDefinitions(fileInfo, this._languages);
            }
        }

        return languageDefinition;
    }
    
    // eslint-disable-next-line no-unused-vars
    _searchDefinitions(fileInfo, definitions, definitionType)
    {
        if (this._languageOverrides)
        {
            if (this._languageOverrides[fileInfo.extension])
            {
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
                    if (this._isShebang(fileInfo.headerLines[0], definition["id-by"]["shebang"]) 
                            || this._isShebang(fileInfo.headerLines[1], definition["id-by"]["shebang"]))
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