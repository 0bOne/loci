
const {parentPort, workerData} = require('worker_threads');
const FileInfo = require('./FileInfo');
const FileProcessor = require('./FileProcessor');
const LanguageMap = require('./LanguageMap');
const Logger = require('./Logger');

try
{
    const logger = new Logger(workerData.options, parentPort, workerData.threadNumber);
    logger.Thread("Start of worker thread " + workerData.threadNumber);

    const map = new LanguageMap(this._logger, workerData.options);
    const files = FileInfo.RebuildWorkerFileInfos(workerData.files, workerData.options);
    const processor = new FileProcessor(logger, workerData.options, map, files);
    const output = processor.Scan();

    logger.Thread("End of worker thread " + workerData.threadNumber);
    parentPort.postMessage({id: 'output', data: output})
}
catch (e)
{
    const logger = new Logger(workerData.options, parentPort, workerData.threadNumber);
    logger.Thread("Exception on worker thread " + workerData.threadNumber);
    parentPort.postMessage({id: 'exception', data: JSON.stringify(e)})
}



