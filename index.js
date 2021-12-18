const Loci = require("./lib/Loci");
const OptionsLoader = require("./lib/OptionsLoader");
const Logger = require("./lib/Logger");
const UserGuide = require("./lib/UserGuide");
const OutputFormatter = require("./lib/OutputFormatter");
const StopWatch = require("./lib/StopWatch");

const options = OptionsLoader.Load();

UserGuide.ShowHelp(options); //exits the process IF help is shown

const logger = new Logger(options);

const jc = new Loci(logger);
const startTime = new Date();
const sw = new StopWatch();

const output = jc.Begin(options);

logger.Debug("options", options);
logger.Info(output);


const of = new OutputFormatter(options);
const result = of.Format(output);
console.log("");
//console.log(output);

console.log(result);

