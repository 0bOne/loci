const fs = require("fs");
const path = require("path");
const crypto = require('crypto')

module.exports = class FolderEnumerator
{
    _logger;
    _options;

    constructor(logger, options)
    {
        this._logger = logger;
        this._options = options;

        if (options.i === true)
        {
            //replace list with lower case list for case-insensitive compare
            options.xx = this._toLowerCaseList(options.xx);
            options.xd = this._toLowerCaseList(options.xd);
            options.xn = this._toLowerCaseList(options.xn);            
        }
    }

    _toLowerCaseList(items)
    {
        let list = [];
        for (let item of items)
        {
            list.push(item.toLowerCase());
        }
        return list;
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
                    const fileInfo = this._getFileInfo(source, stats);
                    const ignoreReason = this._getFileIgnoreReason(fileInfo);
                    if (ignoreReason)
                    {
                        this._logger.Debug("\tIgnoring file (" + ignoreReason + "): " + fileInfo.path);   
                    }
                    else
                    {
                        this._logger.Debug("\tAdding file " + source);   
                        files.push(fileInfo);
                    }
                }
                else if (stats.isDirectory() === true)
                {    
                    this._logger.Debug("Examining folder " + source);   
                    const folderName = path.basename(source);  
                    let checkFolderName = (this._options.i === true) ? folderName.toLowerCase() : folderName;             
                    if (this._options.xd.indexOf(checkFolderName) === -1)
                    {
                        const contents = fs.readdirSync(source);
                        const childSources = [];
                        for (const item of contents)
                        {
                            const spec = path.resolve(source, item);
                            childSources.push(spec);
                        }
                        this.EnumerateFiles(childSources, files);
                    }
                    else
                    {
                        this._logger.Debug("Ignoring folder " + folderName);
                    }
                }
            }
        }

        this._logger.DisplayInPlace("files: " + files.length);
    }

    _getFileInfo(spec, stats)
    {
        var fileInfo = {
            path: spec,
            size: stats.size,
            name: path.basename(spec),
            timing:
            {
                disambiguation: 0n,
                analysis: 0n
            }
        };     

        var extensionParts = path.basename(spec).split(".");
        extensionParts.shift(); //remove filename
        fileInfo.extension = extensionParts.join(".");

        this._readFileHeader(fileInfo);
        this._getEncoding(fileInfo);
        this._getFileHeaderLines(fileInfo);

        return fileInfo;
    }

    _readFileHeader(fileInfo)
    {
        try 
        {
            const headerBufferSize = Math.min(fileInfo.size, 256);
            if (headerBufferSize > 0)
            {
                const headerBuffer = Buffer.alloc(headerBufferSize, 0);
                const handle = fs.openSync(fileInfo.path, "r+");
                fs.readSync(handle, headerBuffer, 0, headerBufferSize);
                fs.closeSync(handle);
                fileInfo.headerBuffer = headerBuffer;
            }   
        } 
        catch (e) 
        {
            this._logger.Debug("Exception opening file " + fileInfo.path);
            this._logger.Debug("Exception was " + e);
        }
    }

    _getEncoding(fileInfo)
    {
        let buffer = fileInfo.headerBuffer || Buffer.alloc(2);
        fileInfo.encoding="utf8";

        if (buffer[0] === 0xFF && buffer[1] === 0xFE)
        {
            //unicode big endian
            fileInfo.encoding = "ucs2";
        }
        else if (buffer[0] === 0xFE && buffer[1] === 0xFF)
        {
            //unicode little endian
            fileInfo.encoding = "utf16le";
        }
    }

    _getFileHeaderLines(fileInfo)
    {
        let headerContent = new TextDecoder().decode(fileInfo.headerBuffer)
        headerContent = headerContent.replace("\r\n", "\n").replace("\r", "\n");
        fileInfo.headerLines = headerContent.split("\n");
    }

    _getFileIgnoreReason(fileInfo)
    {
        let ignoreReason = false;
        if (fileInfo.size >= 2_147_483_648)
        {
            ignoreReason = "2 GiB File size limit";
        }
        else 
        {
            let name = fileInfo.name;
            let extension = fileInfo.extension;
            if (this._options.i === true)
            {
                name = name.toLowerCase();
                extension = extension.toLowerCase();
            }

            let ultimateExtension = extension.split(".").pop();
            if (this._options.xx.indexOf(ultimateExtension) > -1
                    || this._options.xx.indexOf(extension) > -1)
            {
                ignoreReason = "extension";
            }
            else if (this._options.xn.indexOf(name) > -1)
            {
                ignoreReason = "name";
            }
        }
        return ignoreReason;
    }

    RemoveDuplicateFiles(files)
    {
        const filesToKeep = [];
        files.sort(function compareFn(a, b) {
            return a.size - b.size;
         });

         let lastKeptFile = files.pop();
         filesToKeep.push(lastKeptFile);

         let keptCount = files.length;

         while (files.length > 0)
         {
            let fileToCompare = files.pop();
            let filesMatch = this._filesAreIdentical(lastKeptFile, fileToCompare);
            if (filesMatch === true)
            {
                this._logger.Debug("Skipping non-unique file " + fileToCompare.path);
                keptCount--;
            }
            else
            {
                filesToKeep.push(fileToCompare);
                lastKeptFile = fileToCompare;
            }
            this._logger.DisplayInPlace("files: " + keptCount + " (removing duplicates)");
         }

         return filesToKeep;
    }

    RemoveDuplicateFilesOld(files)
    {        
        const filesToKeep = []; //always keep the very first file
        const filesToCheck = [...files];

        let keptCount = filesToCheck.length;

        while (filesToCheck.length > 0)
        {
            let candidateToKeep = filesToCheck.shift();
            for (let i = 0; i < filesToCheck.length; i++)
            {
                const fileToCompare = filesToCheck[i];
                if (this._filesAreIdentical(candidateToKeep, fileToCompare))
                {
                    this._logger.Debug("Skipping non-unique file " + fileToCompare.path);
                    candidateToKeep = null;
                    keptCount--;
                    break;
                }
            }
            //if we are out of the loop and still have a candidate, save it
            if (candidateToKeep != null)
            {
                filesToKeep.push(candidateToKeep);
            }
            this._logger.DisplayInPlace("files: " + keptCount + " (removing duplicates)");
        }

        return filesToKeep;
    }
    
    _filesAreIdentical(firstFile, secondFile)
    {
        //do fast compares first so that slow compare (md5) is only used if absolutely necessary
        if (firstFile.size === secondFile.size)
        {
            //they have the same size, so compare first lines 
            if (firstFile.headerLines[0] === secondFile.headerLines[1])
            {
                //they have the same size and first line, so compare md5 checksums
                this._ensureMD5Present(firstFile);
                this._ensureMD5Present(secondFile);
                if  (firstFile.md5 === secondFile.md5)  
                {
                    return true;
                }   
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