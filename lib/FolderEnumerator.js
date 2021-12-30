const fs = require("fs");
const path = require("path");
const FileInfo = require("./FileInfo");

module.exports = class FolderEnumerator
{
    _logger;
    _options;

    constructor(logger, options)
    {
        this._logger = logger;
        this._options = options;   
        BigInt.prototype.toJSON = function() { return this.toString(); };
    }

    EnumerateFiles(sources, files)
    {        
        for (const source of sources)
        {
            if (fs.existsSync(source) === true)
            {
                const stats = fs.lstatSync(source);
                if (stats.isFile()=== true)
                {
                    const fileInfo = new FileInfo(source, stats.size, this._options);
                    this._logger.Debug("\tAdding file " + source);   
                    files.push(fileInfo);
                }
                else if (stats.isDirectory() === true)
                {    
                    this._logger.Debug("Examining folder " + source);   
                    
                    const contents = fs.readdirSync(source);
                    const childSources = [];
                    for (const item of contents)
                    {
                        const spec = path.resolve(source, item);
                        childSources.push(spec);
                    }
                    this.EnumerateFiles(childSources, files);         
                }
            }
        }

        this._logger.DisplayInPlace("files: " + files.length);
    }     
}