const path = require("path");
const {Worker} = require('worker_threads')
const sleep = require('system-sleep');

const OptionsLoader = require("./OptionsLoader");
const FolderEnumerator = require("./FolderEnumerator");
const StopWatch = require("./StopWatch");
const Logger = require("./Logger");
const UserGuide = require("./UserGuide");
const OutputFormatter = require("./OutputFormatter");
const Deduplicator = require("./Deduplicator");
const FileProcessor = require("./FileProcessor");
const LanguageMap = require("./LanguageMap");

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
        const requiredMajorVersion = 14;
        this._majorVersion = Number.parseInt(process.versions.node.split(".")[0]);
        if (this.majorVersion < requiredMajorVersion)
        {
            console.log("Current major version is " + this.majorVersion);
            console.error("Must run on node version " + requiredMajorVersion + " or newer. Unable to continue.");
            process.exit(1);
        }
    }

    Scan(options)
    {         
        //create a throwaway language processor to trigger the --langs switch validation before processing begins
        new LanguageMap(this._logger, options);
        //will exit the process if switch is invalid.
    
        
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
            const deduplicator = new Deduplicator(this._logger);
            files = deduplicator.RemoveDuplicates(files);
            uniqueFiles = files.length;
            timing.removeDuplicates = sw.Reset();
        }
        else
        {
            this._logger.Info("Duplicates will be counted");
        }
        
        this._logger.DisplayInPlace("Counting...");

        let output;

        this._determineThreadCount(files, options);
        if (options.threads === 1)
        {
            this._logger.Thread("Counting with 1 thread");
            output = this._countSingleThreaded(files, options);
        }
        else
        {
            this._logger.Thread("Counting with multiple threads");
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

    _determineThreadCount(files, options)
    {
        const DEFAULT_THREAD_COUNT = 4;

        if (this.majorVersion < 15)
        {
            //always single threaded
            options.threads = 1;  
        }
        else if (options.threads > -1)
        {
            //go with the specified value
        }
        else if (files.length < options.tf)
        {
            //threads not specified, and low number of files. go with one thread
            options.threads = 1;
        }
        else if (options.threads === -1)
        {
            //threads not specified, high number of files. go with default number of threads 
            options.threads = DEFAULT_THREAD_COUNT; 
        } 
        this._logger.Thread("Number of threads: " + options.threads);
    }

    _countSingleThreaded(files, options)
    {
        const map = new LanguageMap(this._logger, options);
        const processor = new FileProcessor(this._logger, options, map, files);
        const output = processor.Scan();
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
            const returnData = this._createAnotherThread(options, bucket.files);
            returnDatas.push(returnData); //will be empty unti thread provides output
        }

        var stopTime = new Date(new Date().getTime() + (options.timeout * 1_000));

        const arraySumReducer = (accumulator, curr) => accumulator + curr;

        let keepWaiting = true;
        while (keepWaiting)
        {
            this._logger.Thread("Waiting on remaining threads: " + this._threadCount);
            if (this._threadCount < 2)
            {
                this._logger.Thread("all worker threads terminated");
                keepWaiting = false;
            }
            else if (stopTime <= new Date())
            {
                //send to console so it always gets shown.
                console.error("timed out waiting for thread completion. unable to continue.");
                process.exit(1);
                keepWaiting = false;         
            }
            else
            {
                let totalFiles = this._threadProgress.reduce(arraySumReducer);
                this._logger.DisplayInPlace("Counting files. Remaining: " + totalFiles);
                sleep(200);
            }
        }

        this._logger.Thread("All worker threads complete. Consolidating outputs");

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

    _createAnotherThread(options, files)
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
        const options = Loci.LoadOptionsAndSwitches();

        //or programmatically, just load the defaults and make changes
        //const options = OptionsLoader.LoadDefaults();
        //options.xf.push("not_this_folder");
        //options.threads = 10;

        //exits the process IF help is shown. Skip if you are calling programmatically
        Loci.ShowHelp(options); 
    
        //the default logger logs to the console. 
        //Or pass in your own logger implementing the same methods
        const logger = Loci.GetLogger(options);
        
        //intantiate and scan
        const loci = new Loci(logger);      
        const output = loci.Scan(options);
        
        //optionally log the output after scan completes
        logger.Debug("options", options);
        logger.Info(output);
        
        //format and display the output.
        const formatter = Loci.GetFormatter(options);
        const textResult = formatter.Format(output);
        console.log("");        
        console.log(textResult);
    }

    static LoadOptionsAndSwitches()
    {
        return OptionsLoader.Load();
    }

    static LoadDefaultOptions()
    {
        return OptionsLoader.LoadDefaults();
    }

    static ShowHelp(options)
    {
        UserGuide.ShowHelp(options); 
    }

    static GetLogger(options)
    {
        return new Logger(options, 0);
    }

    static GetFormatter(options)
    {
        return new OutputFormatter(options);   
    }
}
