const YAML = require("yaml");
const fs = require("fs");
const path = require("path");
const crypto = require('crypto')
const LanguageProcessor = require("./LanguageProcessor");
const OptionsLoader = require("./OptionsLoader");

module.exports = class Loci
{
    _loadYamlDoc(fileName)
    {
        const fileSpec = path.resolve(__dirname, "data", fileName);
        const rawYAML = fs.readFileSync(fileSpec, "utf-8");
        const documents = YAML.parseAllDocuments(rawYAML);   
        for (let doc of documents)
        {
            const jsonDoc = doc.toJSON();
            //add id to each property in the document
            for (const itemId in jsonDoc)
            {
                jsonDoc[itemId].id = itemId;
            }
            return jsonDoc;
        }
        return {};
    }

    Begin(sources, options)
    {
        //everything in the context is new, so that multiple passes can be compared
        //(when that option is implemented later)

        const languages = this._loadYamlDoc("languages.yaml");
        const context = {
            options: OptionsLoader.Load(options),
            files: [],
            extensions: {},
            definitions: {
                specials: this._loadYamlDoc("special-files.yaml"),
                conflicts: this._loadYamlDoc("ambiguous-files.yaml")
            },
            output:
            {
                files: {
                    total: 0,
                    unique: 0,
                    unrecognized: 0,
                    recognized: 0,
                    ambiguous: 0,
                    special: 0,
                    ignored: 0
                },
                counts: {},
                totals:{
                    lines: 0,
                    blank: 0,
                    code: 0,
                    comment: 0
                }
            },

        };

        //TODO: add default ignore folders and ignore them during enumeration
        this._enumerateFiles(sources, context);
        context.output.files.total = context.files.length;

        this._removeDuplicateFiles(context);
        context.output.files.unique = context.files.length;

        const lp = new LanguageProcessor(languages);
        lp.ProcessFiles(context);

        if (process.stdout.clearLine)
        {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
        }
        return context.output;
        //console.log(context.options);
    }

    _enumerateFiles(sources, context)
    {        
        const start100 = Math.floor(context.files.length / 100);

        for (const source of sources)
        {
            if (fs.existsSync(source) === true)
            {
                const stats = fs.lstatSync(source);
                if (stats.isFile()=== true)
                {
                    this._addFileInfo(context, source, stats);
                }
                else if (stats.isDirectory() === true)
                {       
                    const folderName = path.basename(source);      
                    if (context.options.exclude_dir.indexOf(folderName) === -1)
                    {
                        const contents = fs.readdirSync(source);
                        const childSources = [];
                        for (const item of contents)
                        {
                            const spec = path.resolve(source, item);
                            childSources.push(spec);
                        }
                        this._enumerateFiles(childSources, context);
                    }
                    else
                    {
                        console.log("ignoring folder " + folderName);
                    }
                }
            }
        }

        const end100 = Math.floor(context.files.length / 100);
        if (end100 > start100)
        {
            if (process.stdout.clearLine)
            {
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write("\tfiles: " + end100 * 100);
            }
        }

    }

    _addFileInfo(context, spec, stats)
    {
        var fileInfo = {
            path: spec,
            size: stats.size,
            name: path.basename(spec),
        };
        var extensionParts = path.basename(spec).split(".");
        extensionParts.shift(); //remove filename
        fileInfo.extension = extensionParts.join(".");
        //console.log(fileInfo);
        context.files.push(fileInfo);
        //track the number of occurrences of this extension
        context.extensions[fileInfo.extension] = context.extensions[fileInfo.extension] || 0;
        context.extensions[fileInfo.extension]++; 
    }

    _removeDuplicateFiles(context)
    {
        //TODO: implement skip_uniqueness option

        const filesToKeep = []; //always keep the very first file
        const filesToCheck = [...context.files];

        while (filesToCheck.length > 0)
        {
            let candidateToKeep = filesToCheck.shift();
            for (let i = 0; i < filesToCheck.length; i++)
            {
                const fileToCompare = filesToCheck[i];
                if (this._filesAreIdentical(candidateToKeep, fileToCompare))
                {
                    //can't keep the candidate, it exists elsewhere
                    console.log("non unique file: " + candidateToKeep.path);
                    candidateToKeep = null;
                    break;
                }
            }
            //if we are out of the loop and still have a candidate, save it
            if (candidateToKeep != null)
            {
                filesToKeep.push(candidateToKeep);
            }
        }

        context.files = filesToKeep;
    }
    
    _filesAreIdentical(firstFile, secondFile)
    {
        if (firstFile.size === secondFile.size)
        {
            //they are the same size, so compare md5 checksums
            this._ensureMD5Present(firstFile);
            this._ensureMD5Present(secondFile);
            if  (firstFile.md5 === secondFile.md5)  
            {
                return true;
            }     
        }
        return false;
    }

    _ensureMD5Present(fileInfo)
    {
        if (fileInfo.md5 === undefined)
        {
            const contents = fs.readFileSync(fileInfo.path, "utf-8");
            fileInfo.md5 = crypto.createHash('md5').update(contents).digest("hex"); 
        }
    }



}