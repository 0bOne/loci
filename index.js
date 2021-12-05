//original command line:
//cloc.pl [options] <file(s)/dir(s)/git hash(es)> | <set 1> <set 2> | <report files>
//this version:
//index [options] dir(s)

const Loci = require("./lib/Loci");

const options = {};
const files = [];

parseArgs(files, options);
console.log(files, options);

const jc = new Loci();

const startTime = new Date();

const output = jc.Begin(files, options);
console.log(output);

const endTime = new Date();
const difference = endTime.getTime() - startTime.getTime();
const seconds = Math.round(difference / 10) / 100;
console.log("time taken: " + seconds + " s");

function parseArgs(sources, options)
{
    //items starting with '--' considered options; other items considered files (in this release)
	const args = {
	 diskFile: process.argv[2],
	 dumpFile: process.argv[3]
	};

    process.argv.shift(); //remove node exe
    process.argv.shift(); //remove entry point script

    for (arg of process.argv)
    {
        if (arg.trim().startsWith("--"))
        {
            let trimmedArg = arg.replace("--", "").trim();
            const tokens = trimmedArg.split("=", 2);
            if (tokens.length == 1)
            {
                tokens[1] = true;
            }
            //convert dashes in option keys to underscores (both are allowed)
            tokens[0] = tokens[0].split("-").join("_"); 
            options[tokens[0]] = tokens[1];
        }
        else
        {
            sources.push(arg);
        }   
    }  
}