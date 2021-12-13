
const {parentPort, workerData} = require('worker_threads');
const languageProcessor = require('./LanguageProcessor');
const Logger = require('./Logger');

try
{
    //console.log('Starting thread with ' + workerData.files.length + " files");
    const logger = new Logger(workerData.options);
    const lp = new languageProcessor(logger, workerData.options);
    const output = lp.ProcessFiles(workerData.files);
    parentPort.postMessage({id: 'output', data: output})
}
catch (e)
{
    parentPort.postMessage({id: 'error', data: e})
}
