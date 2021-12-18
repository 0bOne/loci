
const {parentPort, workerData} = require('worker_threads');
const languageProcessor = require('./LanguageProcessor');
const Logger = require('./Logger');

try
{
    const logger = new Logger(workerData.options);
    const lp = new languageProcessor(logger, workerData.options);
    const output = lp.ProcessFiles(workerData.files);
    parentPort.postMessage({id: 'output', data: output})
}
catch (e)
{
    parentPort.postMessage({id: 'exception', data: e})
}
