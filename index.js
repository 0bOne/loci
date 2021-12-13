const Loci = require("./lib/Loci");
const OptionsLoader = require("./lib/OptionsLoader");
const Logger = require("./lib/Logger");
const UserGuide = require("./lib/UserGuide");
const OutputFormatter = require("./lib/OutputFormatter");


const options = OptionsLoader.Load();

UserGuide.ShowHelp(options); //exits the process IF help is shown

const logger = new Logger(options);

const jc = new Loci(logger);
const startTime = new Date();
const output = jc.Begin(options);

logger.Debug("options", options);
logger.Info(output);

const endTime = new Date();
const difference = endTime.getTime() - startTime.getTime();
const seconds = Math.round(difference / 10) / 100;
logger.Info("time taken: " + seconds + " s");

const of = new OutputFormatter(options);
const result = of.Format(output);
console.log(result);






