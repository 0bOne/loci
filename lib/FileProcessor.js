const Disambiguator = require("./Disambiguator");
const RasterFilter = require("./RasterFilter");
const RuleFilter = require("./RuleFilter");
const LanguageMap = require("./LanguageMap");

module.exports = class FileProcessor
{

    _options;
    _logger;
    _map;

    _ignoredFiles;
    _ambiguousFiles;
    _identifiedFiles;
    _unidentifiedFiles;

    constructor(logger, options, map, files)
    {
        this._logger = logger;
        this._options = options;
        this._map = map;
   
        this._unidentifiedFiles = files;
        this._ignoredFiles = [];
        this._identifiedFiles = []; 
        this._ambiguousFiles = [];
    }

    Scan()
    {
        //1. Remove discards based on xd, xx, xn options
        this._ignoreFilesByOptions();
        
        //2. Identify files by piece of filename
        this._identifyFilesByFilename();
        this._identifyFilesByPrefix();
        this._identifyFilesByExtension();

        //3. Identify by Shebang
        this._identifyFilesByShebang();

        //4. Identify any that have ambiguous extensions, but can be disambiguated
        this._identifyAmbiguousFiles();

        //now do the scan
        this._countCodeInFiles();
        
        //build and return the statistics
        return this._createStatistics();
    }

    _ignoreFilesByOptions()
    {
        const filesToKeep = [];
        for (let fileInfo of this._unidentifiedFiles)
        {
            if (fileInfo.ShouldBeIgnored() === true)
            {
                this._ignoredFiles.push(fileInfo);
            }
            else
            {
                filesToKeep.push(fileInfo);
            }

        } //each file

        this._unidentifiedFiles = filesToKeep;
    }

    _classifyByCollectionType(fileInfo, definition)
    {
        if (definition)
        {
            if (definition.collection === LanguageMap.COLLECTION_SPECIALS)
            {
                //TODO: in a future release, only non-code specials will be ignored. 
                //Archives or others will be processed TBD
                fileInfo.definition = definition;
                this._ignoredFiles.push(fileInfo);
            }
            else if (definition.collection === LanguageMap.COLLECTION_CONFLICTS)
            {
                fileInfo.definition = definition;
                this._ambiguousFiles.push(fileInfo);
            }
            else if (definition.collection === LanguageMap.COLLECTION_LANGUAGES)
            {
                fileInfo.definition = definition;
                this._identifiedFiles.push(fileInfo);
            }
            else
            {
                this._unidentifiedFiles.push(fileInfo);
            }
        }
        else
        {
            this._unidentifiedFiles.push(fileInfo);
        }
    }

    _identifyFilesByFilename()
    {
        const filesToIdentify = this._unidentifiedFiles;
        this._unidentifiedFiles = [];

        for(let fileInfo of filesToIdentify)
        {
            const matchedDefinition = this._map.GetDefinitionByFilename(fileInfo);
            this._classifyByCollectionType(fileInfo, matchedDefinition);
        }
    }

    _identifyFilesByPrefix()
    {
        const filesToIdentify = this._unidentifiedFiles;
        this._unidentifiedFiles = [];

        for(let fileInfo of filesToIdentify)
        {
            const matchedDefinition = this._map.GetDefinitionByPrefix(fileInfo);
            this._classifyByCollectionType(fileInfo, matchedDefinition);
        }
    }

    _identifyFilesByExtension()
    {
        const filesToIdentify = this._unidentifiedFiles;
        this._unidentifiedFiles = [];

        for(let fileInfo of filesToIdentify)
        {
            const matchedDefinition = this._map.GetDefinitionByExtension(fileInfo);
            this._classifyByCollectionType(fileInfo, matchedDefinition);
        }
    }

    _identifyFilesByShebang()
    {
        const filesSToIdentify = this._unidentifiedFiles;
        this._unidentifiedFiles = [];
        for (let fileInfo of filesSToIdentify)
        {
            const shebang = fileInfo.GetShebang();
            if (shebang === false)
            {
                this._unidentifiedFiles.push(fileInfo);
            }
            else
            {
                const matchedDefinition = this._map.ShebangMap[shebang];
                this._classifyByCollectionType(fileInfo, matchedDefinition);
            }
        }
    }

    _identifyAmbiguousFiles()
    {
        if (this._ambiguousFiles.length > 0)
        {
            const disambiguator = new Disambiguator(this._logger, this._options, this._map.Languages);
            for (let fileInfo of this._ambiguousFiles)
            {
                let matchedDefinition = disambiguator.DetermineDefinition(fileInfo);
                this._classifyByCollectionType(fileInfo, matchedDefinition);
            }
        }
    }

    _countCodeInFiles()
    {
        const rulesFilter = new RuleFilter(this._logger, this._options);
        const rasterFilter = new RasterFilter(this._logger, this._options, this._map);

        for (let fileInfo of this._identifiedFiles)
        {
            if (this._options.raster === true && fileInfo.definition.raster)
            {
                fileInfo.statistics = rasterFilter.GetStatistics(fileInfo, fileInfo.definition);
            }
            else
            {
                fileInfo.statistics = rulesFilter.GetStatistics(fileInfo, fileInfo.definition);
            } 
        }       
    }

    _createStatistics()
    {
        const output = {
            files: {
                total: 0, 
                unique: 0, 
                unrecognized: this._unidentifiedFiles.length, 
                recognized: this._identifiedFiles.length, 
                ambiguous: this._ambiguousFiles.length, 
                ignored: this._ignoredFiles.length
            },
            counts: {},
            timing: {analysis: 0n, disambiguation: 0n},
            totals:{blank: 0, code: 0, comment: 0, files: 0, lines: 0, languages: 0}
        };

        //TODO: update stats on the definition, not the file, then collect at the end.
        for (let fileInfo of this._identifiedFiles)
        {
            output.totals.files ++;

            let languageId = fileInfo.definition.id;
            
            if (fileInfo.timing)
            {
                output.timing.analysis += fileInfo.timing.analysis;
                output.timing.disambiguation += fileInfo.timing.disambiguation;
            }
            if (output.counts[languageId] === undefined)
            {
                output.counts[languageId] = {
                    files: 0,
                    blank: 0,
                    comment: 0,
                    code: 0,
                    total: 0,
                    analysis: 0n,
                    disambiguation: 0n
                };
            }

            if (this._options.scale === true && fileInfo.definition["scale-factor"])
            {
                fileInfo.statistics.blank *= fileInfo.definition["scale-factor"];
                fileInfo.statistics.comment *= fileInfo.definition["scale-factor"];
                fileInfo.statistics.code *= fileInfo.definition["scale-factor"];
                fileInfo.statistics.total *= fileInfo.definition["scale-factor"];
            }

            output.counts[languageId].files ++;
            output.counts[languageId].blank += fileInfo.statistics.blank;
            output.counts[languageId].code += fileInfo.statistics.code;        
            output.counts[languageId].comment += fileInfo.statistics.comment;
             output.counts[languageId].total += fileInfo.statistics.total;        
            output.counts[languageId].analysis += fileInfo.timing.analysis;
            output.counts[languageId].disambiguation += fileInfo.timing.disambiguation;
        
            output.totals.blank += fileInfo.statistics.blank;
            output.totals.comment += fileInfo.statistics.comment;
            output.totals.code += fileInfo.statistics.code;
            output.totals.lines += fileInfo.statistics.total;  

        } //for each file

        output.totals.languages = Object.keys(output.counts).length;

        return output;
    }
}