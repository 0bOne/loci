const YamlHelp = require("./YamlHelp");


module.exports = class LanguageMap
{

    static COLLECTION_SPECIALS = "SPECIALS";
    static COLLECTION_LANGUAGES = "LANGUAGES";
    static COLLECTION_CONFLICTS = "CONFLICTS";

    _logger;
    _options;

    Languages;
    Specials;
    Conflicts;

    ExtensionMap;
    ShebangMap;
    FilenameMap;
    PrefixMap;

    constructor(logger, options)
    {
        this._logger = logger;
        this._options = options;

        this.ExtensionMap = {};
        this.ShebangMap = {};
        this.FilenameMap = {};
        this.PrefixMap = {};

        this.Languages = this._loadDefinition("languages.yaml");
        this.Specials = this._loadDefinition("special-files.yaml");
        this.Conflicts  = this._loadDefinition("ambiguous-files.yaml");

        this._addCollection(LanguageMap.COLLECTION_LANGUAGES, this.Languages);
        this._addCollection(LanguageMap.COLLECTION_SPECIALS, this.Specials);
        this._addCollection(LanguageMap.COLLECTION_CONFLICTS, this.Conflicts);

        this._addLanguageOptionOverrides();
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

    _addCollection(collectionName, collection)
    {
        for(const definitionId in collection)
        {
            let definition = collection[definitionId];
            definition.collection = collectionName;

            if (definition["id-by"])
            {
                if (definition["id-by"].extension)
                {
                    for (let ext of definition["id-by"].extension)
                    {
                        if (this._options.i === true)
                        {
                            ext = ext.toLowerCase();
                        }
                        this.ExtensionMap[ext] = definition;
                    }
                }
                if (definition["id-by"].prefix)
                {
                    for (let prefix of definition["id-by"].prefix)
                    {
                        if (this._options.i === true)
                        {
                            prefix = prefix.toLowerCase();
                        }
                        this.PrefixMap[prefix] = definition;
                    }
                }
                if (definition["id-by"].filename)
                {
                    for (let filename of definition["id-by"].filename)
                    {
                        if (this._options.i === true)
                        {
                            filename = filename.toLowerCase();
                        }
                        this.FilenameMap[filename] = definition;
                    }
                }          
                if (definition["id-by"].shebang)
                {
                    for (let shebang of definition["id-by"].shebang)
                    {
                        this.ShebangMap[shebang] = definition;
                    }
                }
            } //if id-by property exists
        } //each language definition in collection
    }

    _addLanguageOptionOverrides()
    {
        //add overrides
        for (let langItem of this._options.langs)
        {
            const tokens = langItem.split("=");
            const extension = tokens[0];
            const languageId =  tokens[1];
            if (this._languages[languageId] === undefined)
            {
                console.error("unrecognized language in langs option: " + langItem);
                process.exit(1);
            }
            this._extensionMap[extension] = this._languages[languageId];
        }
    }

    GetDefinitionByFilename(fileInfo)
    {  
        if (this.FilenameMap[fileInfo.name])
        {
            return this.FilenameMap[fileInfo.name];
        }
    }

    GetDefinitionByPrefix(fileInfo)
    {
        if (this.PrefixMap[fileInfo.prefix])
        {
            return this.PrefixMap[fileInfo.prefix];
        }
    }

    GetDefinitionByExtension(fileInfo)
    {  
        if (this.ExtensionMap[fileInfo.extension])
        {
            return this.ExtensionMap[fileInfo.extension];
        }
        else if (this.ExtensionMap[fileInfo.ultimateExtension])
        {
            return this.ExtensionMap[fileInfo.ultimateExtension];
        }
    }
}