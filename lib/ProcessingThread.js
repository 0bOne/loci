
const {parentPort, workerData} = require('worker_threads');
const languageProcessor = require('./LanguageProcessor');
const Logger = require('./Logger');

try
{
    const logger = new Logger(workerData.options, parentPort, workerData.threadNumber);
    logger.Thread("Start of worker thread " + workerData.threadNumber);
    const lp = new languageProcessor(logger, workerData.options);
    const output = lp.ProcessFiles(workerData.files);
    logger.Thread("End of worker thread " + workerData.threadNumber);
    parentPort.postMessage({id: 'output', data: output})
}
catch (e)
{
    logger.Thread("Exception on worker thread " + workerData.threadNumber);
    parentPort.postMessage({id: 'exception', data: e})
}
