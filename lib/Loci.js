const OptionsLoader = require("./OptionsLoader");
const LanguageProcessor = require("./LanguageProcessor");
const FolderEnumerator = require("./FolderEnumerator");
const {Worker} = require('worker_threads')
const sleep = require('system-sleep');
const path = require("path");
const Output = require("./Logger");
const { Console } = require("console");
const languageProcessor = require("./LanguageProcessor");
module.exports = class Loci
{
    _logger;

    constructor(logger)
    {
        this._logger = logger;
    }

    Begin(options)
    {   
        {
            //create a throwaway language processor to trigger the langs switch validation before processing begins
            const unusedLanguageProcessor = new languageProcessor(this._logger, options);
            //will exit the process if switch is invalid.
        }

        const fe = new FolderEnumerator(this._logger, options);
        const files = [];
        fe.EnumerateFiles(options.sources, files);
 
        const totalFiles = files.length;
        let uniqueFiles = files.length; 
        if (options.unique)
        {
            this._logger.Info("Removing duplicates");
            fe.RemoveDuplicateFiles(files);
            uniqueFiles = files.length;
        }
        else
        {
            this._logger.Info("Duplicates will be counted");
        }
        
        const startTime = new Date();

        let output;
        if (options.threads < 2 || files.length < 100)
        {
            this._logger.Debug("Counting with 1 thread");
            output = this._countSingleThreaded(files, options);
            output.files.total = totalFiles;
            output.files.unique = uniqueFiles;
        }
        else
        {
            this._logger.Debug("Counting with multiple threads");
            output = this._countMultiThreaded(files, options);
        }

        const endTime = new Date();
        const difference = endTime.getTime() - startTime.getTime();
        output.times = {};
        output.times.seconds = Math.round(difference / 10) / 100;
        
        this._logger.DisplayInPlace("");

        if (options.verbosity === "debug")
        {
            output.options = options;
        }

        return output;
        //console.log(context.options);
    }

    _countSingleThreaded(files, options)
    {
        const lp = new LanguageProcessor(this._logger, options);
        const output = lp.ProcessFiles(files);
        return output;
    }

    _countMultiThreaded(files, options)
    {
        this._output = null;
        this._threadCount = 0;

        const buckets = this._filesToBuckets(options.threads, files);
        const returnDatas = [];
        for (let bucket of buckets)
        {
            const returnData = this._createSingleThread(options, bucket.files);
            returnDatas.push(returnData); //will be empty unti thread provides output
        }

        var stopTime = new Date(new Date().getTime() + (options.timeout * 1_000));

        while (true)
        {
            if (this._threadCount == 0)
            {
                this._logger.Debug("all threads terminated");
                break;
            }
            if (stopTime <= new Date())
            {
                //send to console so it always gets shown.
                console.error("timed out waiting for thread completion. unable to continue.");
                process.exit(1);
                break;
            }
            sleep(500);
        }

        let output;
        for (let returnData of returnDatas)
        {
            if (returnData.output)
            {
                if (output === undefined)
                {
                    output = returnData.output;
                }
                else
                {
                    this._mergeTheadOutput(output, returnData.output);
                }
            }
        }
        return output || {};
    }

    _createSingleThread(options, files)
    {
        this._threadCount++;
        this._logger.Debug("Creating counting thread #" + this._threadCount);
        const threadOptions = {
            workerData: {
                files: files,
                options: options,
                threadNumber: this._threadCount
            }
        };

        const returnData = {};
        const threadScript = path.resolve(__dirname, "ProcessingThread.js");
        const worker = new Worker(threadScript, threadOptions);
        worker.on('message', this._onWorkerMessage.bind(this, returnData));
        worker.on('error', this._onWorkerMessage.bind(this))
        worker.on('exit', this._onWorkerExit.bind(this));

        return returnData;
    }

    _onWorkerMessage(returnData, message)
    {
        if (message.id === "output")
        {
            returnData.output = message.data;
        }
    }

    _onWorkerError(worker, data)
    {
        this._logger.Debug("Thread erroring out");
        this._threadCount--;
    }

    _onWorkerExit(worker, data)
    {
        this._logger.Debug("Thread exit. Thread count now " + this._threadCount);
        this._threadCount--;
    }

    _filesToBuckets(threadCount, files)
    {
        //create a bucket per thread
        const buckets = [];

        for (let thread = 0; thread < threadCount; thread++)
        {
            buckets.push({bytes: 0, files: [], count: 0});
        }

        //place each file in the emptiest bucket, so that they all have a similar amount of processing
        //ignoring ambiguity and filter rule differences
        for (let fileInfo of files)
        {
            let emptiestBucket = buckets[0];
            for (let bucket of buckets)
            {
                if (bucket.bytes < emptiestBucket.bytes)
                {
                    emptiestBucket = bucket;
                }
            }
            emptiestBucket.files.push(fileInfo);
            emptiestBucket.bytes += fileInfo.size;
            emptiestBucket.count++; 
        }

        return buckets;
    }


    _mergeTheadOutput(outputs, output)
    {
        outputs.files.total += output.files.total;
        outputs.files.unique += output.files.unique;
        outputs.files.unrecognized += output.files.unrecognized;
        outputs.files.recognized += output.files.recognized;
        outputs.files.ambiguous += output.files.ambiguous;
        outputs.files.special += output.files.special;
        outputs.files.ignored += output.files.ignored;

        outputs.totals.lines += output.totals.lines;
        outputs.totals.code += output.totals.code;
        outputs.totals.blank += output.totals.blank;
        outputs.totals.comment += output.totals.comment;

        for (let languageId in output.counts)
        {
            if (outputs.counts[languageId])
            {
                outputs.counts[languageId].files += output.counts[languageId].files;
                outputs.counts[languageId].blank += output.counts[languageId].blank;
                outputs.counts[languageId].comment += output.counts[languageId].comment;
                outputs.counts[languageId].code += output.counts[languageId].code;
                outputs.counts[languageId].total += output.counts[languageId].total;
            }
            else
            {
                outputs.counts[languageId] = output.counts[languageId];
            }
        }
    }
}