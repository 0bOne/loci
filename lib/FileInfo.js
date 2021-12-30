const fs = require("fs");
const path = require("path");

module.exports = class FileInfo
{
    path;
    size;
    name;
    extension;

    timing;

    ultimateExtension;
    folder;
    folders;
    prefix;

    md5;
    encoding;

    options;

    constructor(spec, size, options)
    {
        this.options = options;
        this.path = spec;
        this.size = size;
        this.name = path.basename(spec);
        this.timing = {
            disambiguation: 0n,
            analysis: 0n   
        };
   
        var extensionParts = path.basename(spec).split(".");
        extensionParts.shift(); //remove filename
        this.extension = extensionParts.join(".");
        this.ultimateExtension = this.extension.split(".").pop();
        this.folder = path.dirname(this.path);
        this.prefix = this.name.split(".").shift();
  
        if (options.i === true)
        {
            this.name = this.name.toLowerCase();
            this.extension = this.extension.toLowerCase();
            this.folder = this.folder.toLowerCase();
            this.prefix = this.prefix.toLowerCase()
        }
        this.folders = this.folder.split("/").join("/").split("/");
    }

    AddCachedHeader()
    {      
        if (this.headerBuffer === undefined)
        {
            const headerBufferSize = Math.min(this.size, 256);
            if (headerBufferSize > 0)
            {
                let handle;
                const headerBuffer = Buffer.alloc(headerBufferSize, 0);
                try
                {
                    handle = fs.openSync(this.path, "r+");
                    fs.readSync(handle, headerBuffer, 0, headerBufferSize);
                    fs.closeSync(handle);
                    this.headerBuffer = headerBuffer;
                }
                catch
                {
                    fs.closeSync(handle);
                    //do nothing
                }
            }   
        }
    }

    AddCachedEncoding()
    {
        if (this.encoding === undefined)
        {
            this.AddCachedHeader();
            let buffer = this.headerBuffer || Buffer.alloc(2);
            
            this.encoding="utf8";

            if (buffer[0] === 0xFF && buffer[1] === 0xFE)
            {
                //unicode big endian
                this.encoding = "ucs2";
            }
            else if (buffer[0] === 0xFE && buffer[1] === 0xFF)
            {
                //unicode little endian
                this.encoding = "utf16le";
            }
        }
    }

    AddCachedHeaderLines()
    {
        if (this.headerLines === undefined)
        {
            this.AddCachedHeader();
            let headerContent = new TextDecoder().decode(this.headerBuffer);
            headerContent = headerContent.replace("\r\n", "\n").replace("\r", "\n");
            this.headerLines = headerContent.split("\n");
        }
    }

    GetShebang()
    {
        let shebang = false;
        this.AddCachedHeaderLines();
        for (let line of this.headerLines)
        {
            let trimmedLine = line.trim();
            if (trimmedLine.startsWith("#!"))
            {
                shebang = trimmedLine.split("/").pop(); //last item separated by /
                shebang = shebang.split(" ").shift().trim();  //first item separated by space
                break;
            }
        }
        return shebang;
    }

    ShouldBeIgnored()
    {
        let shouldbeIgnored = false;

        if (this.size >= 2_147_483_648)
        {
            shouldbeIgnored = true;
        }
        else if (this.options.xx.indexOf(this.ultimateExtension) > -1 || this.options.xx.indexOf(this.extension) > -1)
        {
            shouldbeIgnored = true;
        }
        else if (this.options.xn.indexOf(this.name) > -1)
        {
            shouldbeIgnored = true;
        }
        else if (this.options.xd.length > 0)
        {
            for (let folderName in this.folders)
            {
                if (this.options.xd.indexOf(folderName) > -1)
                {
                    shouldbeIgnored = true;
                    break;
                }
            }
        }
        return shouldbeIgnored;
    }

    GetBuffer(bufferNumber)
    {
        const MAX_BUFFER_SIZE = 10240;
        const offset = bufferNumber * MAX_BUFFER_SIZE;
        let actualBufferSize = MAX_BUFFER_SIZE;

        if ((offset + actualBufferSize) > this.size)
        {
            //partial buffer to collect.
            const overflow = (offset + actualBufferSize) - this.size;
            actualBufferSize -= overflow;
        }
        if (actualBufferSize > 0)
        {
            const buffer = Buffer.alloc(actualBufferSize);
            let handle;
            try
            {
                handle = fs.openSync(this.path, "r+");
                fs.readSync(handle, buffer, offset, actualBufferSize);
                fs.closeSync(handle);
            }
            catch
            {
                if (handle)
                {
                    fs.closeSync(handle);
                }
            }
            return buffer;
        }
        return false;
    }

    ReadAllText()
    {
        this.AddCachedEncoding();
        const buffer = fs.readFileSync(this.path);
        const content = buffer.toString(this.encoding);
        return content;
    }

    static RebuildWorkerFileInfos(fileInfos, options)
    {
        //work threads get only the data from file infos, not the code; rehydrate as objects
        const rebuilt = [];
        for (let fileInfo of fileInfos)
        {
            rebuilt.push(new FileInfo(fileInfo.path, fileInfo.size, options));
        }
        return rebuilt;
    }
}
