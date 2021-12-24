const fs = require("fs");
const path = require("path");

module.exports = class UserGuide
{

    static ShowHelp(options)
    {   
        if (options.usage === true)
        {
            console.log("Use loci --help");
            process.exit(0);
        }
        else if (options.help === true)
        {
            UserGuide.displayHelpFile("basic-usage.txt");
            process.exit(0);
        }
        else if (options.show.length > 0)
        {
            this.showData(options);
            process.exit(1);
        }
    }

    static displayHelpFile(fileName)
    {
        const fileSpec = path.resolve(__dirname, "data", "help", fileName);
        const helpText = "" + fs.readFileSync(fileSpec);
        console.log(helpText);
    }

    static showData(options)
    {
        let displayText;
        let fileSpec;

        switch(options.show)
        {
            case "languages":
                fileSpec = path.resolve(__dirname, "data", "languages.yaml");
                displayText = "# Default language definition YAML:";
                displayText += fs.readFileSync(fileSpec, "utf-8");
                break;
            case "disambiguation":
                fileSpec = path.resolve(__dirname, "data", "ambiguous-files.yaml");
                displayText = "# Default language disambiguation YAML:";
                displayText += fs.readFileSync(fileSpec, "utf-8");
                break;
            case "defaults":
                fileSpec = path.resolve(__dirname, "data", "default-options.json");
                //can't add a leading comment or it will break the json syntax
                displayText = fs.readFileSync(fileSpec, "utf-8");
                break;
            case "options":
                //can't add a leading comment or it will break the json syntax
                displayText = JSON.stringify(options, null, "\t");
                break;
            case "environmentals":
                fileSpec = path.resolve(__dirname, "data", "help", "environmentals.txt");
                displayText = fs.readFileSync(fileSpec, "utf-8");
                break;
            default: 
                console.error("Unrecognized 'show' switch: " + options.show);
                process.exit(1);
                break;
        }

        console.log(displayText);
        process.exit(0);

    }
}