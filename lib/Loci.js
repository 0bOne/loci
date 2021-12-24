const OptionsLoader = require("./OptionsLoader");
const LanguageProcessor = require("./LanguageProcessor");
const FolderEnumerator = require("./FolderEnumerator");
const {Worker} = require('worker_threads')
const sleep = require('system-sleep');
const path = require("path");
const languageProcessor = require("./LanguageProcessor");
const StopWatch = require("./StopWatch");
const Logger = require("./Logger");
const UserGuide = require("./UserGuide");
const OutputFormatter = require("./OutputFormatter");


module.exports = class Loci
{
    _logger;

    constructor(logger)
    {
        this._logger = logger;
        this.checkVersion();
    }

    checkVersion()
    {
        const requiredMajorVersion = 15;
        const majorVersion = process.versions.node.split(".")[0];
        if (majorVersion < requiredMajorVersion)
        {
            console.log("Current major version is " + majorVersion);
            console.error("Must run on node version " + requiredMajorVersion + " or newer. Unable to continue.");
            process.exit(1);
        }
    }

    Begin(options)
    {   
        {
            //create a throwaway language processor to trigger the --langs switch validation before processing begins
            new languageProcessor(this._logger, options);
            //will exit the process if switch is invalid.
        }
        
        const timing = {
            folderScan: 0n,
            removeDuplicates: 0n,
            codeScan: 0n,
        };

        const sw = new StopWatch();


        const fe = new FolderEnumerator(this._logger, options);
        let files = [];
        fe.EnumerateFiles(options.sources, files);

        timing.folderScan = sw.Reset();

        const totalFiles = files.length;

        let uniqueFiles = files.length; 

        if (options.unique)
        {
            this._logger.Info("Removing duplicates");
            files = fe.RemoveDuplicateFiles(files);
            uniqueFiles = files.length;
            timing.removeDuplicates = sw.Reset();
        }
        else
        {
            this._logger.Info("Duplicates will be counted");
        }
        

        this._logger.DisplayInPlace("Counting...");

        let output;
        if (options.threads < 2 || files.length < 100)
        {
            this._logger.Debug("Counting with 1 thread");
            output = this._countSingleThreaded(files, options);
        }
        else
        {
            this._logger.Debug("Counting with multiple threads");
            output = this._countMultiThreaded(files, options);
        }


        output.files.total = totalFiles;
        output.files.unique = uniqueFiles;

        timing.codeScan = sw.Reset();
        
        this._logger.DisplayInPlace("");

        output.timing.folderScan = timing.folderScan;
        output.timing.codeScan = timing.codeScan;
        output.timing.removeDuplicates = timing.removeDuplicates;
        output.timing.total = timing.folderScan + timing.codeScan + timing.removeDuplicates;
        
        return output;
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
        this._threadProgress = [];
        for (let bucket of buckets)
        {
            const returnData = this._createSingleThread(options, bucket.files);
            returnDatas.push(returnData); //will be empty unti thread provides output
        }

        var stopTime = new Date(new Date().getTime() + (options.timeout * 1_000));

        const arraySumReducer = (accumulator, curr) => accumulator + curr;

        const always = true;
        while (always)
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

            let totalFiles = this._threadProgress.reduce(arraySumReducer);
            this._logger.DisplayInPlace("Counting files. Remaining: " + totalFiles);
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
                    this._addOutputTotals(output, returnData.output);
                }
            }
        }
        return output || {};
    }

    _createSingleThread(options, files)
    {
        this._logger.Debug("Creating counting thread #" + this._threadCount);
        this._threadCount++;  //background threads start at 1 because main thread is 0;
        const threadOptions = {
            workerData: {
                files: files,
                options: options,
                threadNumber: this._threadCount
            }
        };

        this._threadProgress[threadOptions.workerData.threadNumber] = files.length;

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
        this._logger.Thread("Thread message: " + message.id);

        if (message.id === "output")
        {
            this._logger.Thread("Thread output: ");
            returnData.output = message.data;
        }
        else if (message.id === "exception")
        {
            this._logger.Thread("Thread exception: " + message);
        }
        else if (message.id === "progress")
        {
            this._threadProgress[message.threadNumber] = message.data;
        }

    }

    // eslint-disable-next-line no-unused-vars
    _onWorkerError(worker, data)
    {
        this._logger.Thread("Thread erroring out");
        this._threadCount--;
    }

    // eslint-disable-next-line no-unused-vars
    _onWorkerExit(worker, data)
    {
        this._logger.Thread("Thread exit. Thread count now " + this._threadCount);
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


    _addOutputTotals(totalOutputs, output)
    {
        totalOutputs.files.total += output.files.total;
        totalOutputs.files.unique += output.files.unique;
        totalOutputs.files.unrecognized += output.files.unrecognized;
        totalOutputs.files.recognized += output.files.recognized;
        totalOutputs.files.ambiguous += output.files.ambiguous;
        totalOutputs.files.special += output.files.special;
        totalOutputs.files.ignored += output.files.ignored;

        totalOutputs.totals.lines += output.totals.lines;
        totalOutputs.totals.code += output.totals.code;
        totalOutputs.totals.blank += output.totals.blank;
        totalOutputs.totals.comment += output.totals.comment;

        totalOutputs.timing.analysis += output.timing.analysis;
        totalOutputs.timing.disambiguation += output.timing.disambiguation;

        for (let languageId in output.counts)
        {
            if (totalOutputs.counts[languageId])
            {
                totalOutputs.counts[languageId].files += output.counts[languageId].files;
                totalOutputs.counts[languageId].blank += output.counts[languageId].blank;
                totalOutputs.counts[languageId].comment += output.counts[languageId].comment;
                totalOutputs.counts[languageId].code += output.counts[languageId].code;
                totalOutputs.counts[languageId].total += output.counts[languageId].total;
                
                totalOutputs.counts[languageId].analysis += output.counts[languageId].analysis;
                totalOutputs.counts[languageId].disambiguation += output.counts[languageId].disambiguation;
            }
            else
            {
                totalOutputs.counts[languageId] = output.counts[languageId];
            }
        }

    }

    static CLIScan()
    {
        const options = OptionsLoader.Load(); //loads defaults, switches, environment variables

        //or programmatically, just load the defaults and make changes
        //const options = OptionsLoader.LoadDefaults();
        //options.xf.push("not_this_folder");
        //options.threads = 10;

        //exits the process IF help is shown. Skip if you are calling programmatically
        UserGuide.ShowHelp(options); 
    
        //the default logger logs to the console. 
        //Or pass in your own logger implementing the same methods
        const logger = new Logger(options, 0);
        
        //intantiate and scan
        const loci = new Loci(logger);      
        const output = loci.Begin(options);
        
        //optionally log the output after scan completes
        logger.Debug("options", options);
        logger.Info(output);
        
        //format and display the output.
        const formatter = new OutputFormatter(options);
        const textResult = formatter.Format(output);
        console.log("");        
        console.log(textResult);
    }

}