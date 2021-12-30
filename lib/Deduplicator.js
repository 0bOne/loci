module.exports = class Deduplicator
{

    _logger;

    constructor(logger)
    {
        this._logger = logger;
    }

    RemoveDuplicates(files)
    {
        let keptCount = files.length;  
    
        //sort files by size
        const sizeMap = {};
        for (let fileInfo of files)
        {
            fileInfo.IsUnique = (fileInfo.size > 0);
            if (fileInfo.ShouldBeIgnored() === false && fileInfo.size > 0)
            {
                sizeMap[fileInfo.size] = sizeMap[fileInfo.size] || [];
                sizeMap[fileInfo.size].push(fileInfo);
            }
        }
 
        //this quatri-nested loop is for best peformance!
        for (let size in sizeMap)
        {
            let sizeArray = sizeMap[size];
            //compare all items int he same size array:
            if (sizeArray.length > 1)
            {
                for (let i = 0; i < sizeArray.length -1; i++)
                {
                    const firstFile = sizeArray[i];
                    let bufferNumber = 0;
                    let firstBuffer = firstFile.GetBuffer(bufferNumber);

                    while (firstBuffer !== false)
                    {
                        for (let j = i + 1; j < sizeArray.length; j++)
                        {
                            let filesMatch = true;
                            const secondFile = sizeArray[j];
                            if (secondFile.IsUnique === true)
                            {
                                let secondBuffer = secondFile.GetBuffer(bufferNumber);
                                if (secondBuffer === false)
                                {
                                    filesMatch = false
                                }
                                else if (firstBuffer.length !== secondBuffer.length)
                                {
                                    filesMatch = false;
                                }
                                else //compare buffers
                                {                             
                                    filesMatch = (Buffer.compare(firstBuffer, secondBuffer) === 0)
                                }

                                if (filesMatch === true)
                                {
                                    this._logger.Debug("Skipping non-unique file " + secondFile.path);
                                    secondFile.IsUnique = false;
                                    keptCount --;
                                    this._logger.DisplayInPlace("files: " + keptCount + " (removing duplicates)");
                                }
                            } //compare if ssecond file is marked unique                           
                        } //for each second file
                        bufferNumber++;
                        firstBuffer = firstFile.GetBuffer(bufferNumber);
                    } //until first file EOF          
                } //for all first files in size map
            } //map array has multile files
        } //for all size map arrays

        //sort the kept from the discarded
        const filesToKeep = [];

        for (let fileInfo of files)
        {
            if (fileInfo.IsUnique === true)
            {
                filesToKeep.push(fileInfo);
            }
        }

        return filesToKeep
    }
}