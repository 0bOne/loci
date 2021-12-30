const fs = require("fs");
const path = require("path");

module.exports = class OptionsLoader
{
    static LoadDefaults()
    {
        const defaultFile = path.resolve(__dirname, "data", "default-options.json");
        const rawDefaultOptions = fs.readFileSync(defaultFile, "utf-8");
        let options = JSON.parse(rawDefaultOptions);
        OptionsLoader.Groom(options);
        return options;
    }

    static Load()
    {
        const defaultFile = path.resolve(__dirname, "data", "default-options.json");
        const rawDefaultOptions = fs.readFileSync(defaultFile, "utf-8");
        let options = JSON.parse(rawDefaultOptions);

        const aliaseFile = path.resolve(__dirname, "data", "environment-variable-aliases.json");
        const rawAliases = fs.readFileSync(aliaseFile, "utf-8");
        const aliases = JSON.parse(rawAliases);

        OptionsLoader.applyEnvironmentVariables(options, aliases.originals);
        OptionsLoader.applyEnvironmentVariables(options, aliases.friendlies);
        OptionsLoader.applyCommandLineSwitches(options);

        const altOptionsFile = options.options;
        if (altOptionsFile.length > 0)
        {
            //we found an options file in the options. We need to start with clean defaults, and re-apply in order
            //so that overrides are in the correct order
            options = JSON.parse(rawDefaultOptions);
            OptionsLoader.applyFileBasedOptions(options, altOptionsFile);
            OptionsLoader.applyEnvironmentVariables(options, aliases.originals);
            OptionsLoader.applyEnvironmentVariables(options, aliases.friendlies);
            OptionsLoader.applyCommandLineSwitches(options);    
        }

        OptionsLoader.applyNumberedEnvironmentSources(options);

        OptionsLoader.Groom(options);
        return options;
    }

    static applyFileBasedOptions(options, altOptionsFile)
    {
        //console.log("found file based options");
        altOptionsFile = path.resolve(altOptionsFile);
        const rawOptions = fs.readFileSync(altOptionsFile);
        const altOptions = JSON.parse(rawOptions);   

        const args = [];
        for(let key in altOptions)
        {
            const arg = "--" + key + ":" + altOptions[key];
            args.push(arg);
        }

        if (args.length > 0)
        {
            OptionsLoader.updateOptions(options, args);
        }     
    }

    static applyNumberedEnvironmentSources(options)
    {
        for (let n = 1; n < 100; n++)
        {
            const variable_name = "LOCI_ENV_SOURCE_" + n.toString().padStart(2, "0");
            const variable_value = process.env[variable_name] || "";
            if (variable_value.length > 0)
            {
                options.sources.push(variable_value);
            }
        }
    }

    static applyEnvironmentVariables(options, aliases)
    {
        const args = [];
        for (let variable_name in aliases)
        {
            const switch_name = aliases[variable_name];
            const variable_value = process.env[variable_name] || "";
            if (variable_value.length > 0)
            {
                const arg = "--" + switch_name + ":" + variable_value;
                args.push(arg);
            }
        }

        //console.log("args", args);

        if (args.length > 0)
        {
            OptionsLoader.updateOptions(options, args);
        }
    }   


    static applyCommandLineSwitches(options)
    {
        //items starting with '--' considered options; other items considered files (in this release)

        const args = [...process.argv];
        args.shift(); //remove node exe
        args.shift(); //remove entry point script

        this.updateOptions(options, args);
    }

    static updateOptions(options, args)
    {   
        for (let arg of args)
        {
            if (arg.trim().startsWith("--"))
            {
                let trimmedArg = arg.replace("--", "").trim();
                let tokens = trimmedArg.split(":");
                if (tokens.length > 2)
                {
                    const twoTokens = [];
                    twoTokens[0] = tokens.shift();
                    twoTokens[1] = tokens.join(":");
                    tokens = twoTokens
                }
                if (tokens.length == 1)
                {
                    tokens[1] = "true";
                }
                const key = tokens[0].split("-").join("_"); 
                if (options[key] === undefined)
                {
                    console.error("Invalid switch: --" + key);
                    process.exit(1);
                }
                else if (Array.isArray(options[key]))
                {
                    if (tokens[1].startsWith("+"))
                    {
                        //add to defaults
                        tokens[1] = tokens[1].substr(1);
                        const additionalItems = tokens[1].split(";");
                        options[key] = [...options[key], ...additionalItems];
                    }
                    else 
                    {
                        //replace defaults
                        options[key] = tokens[1].split(";");
                    }
                }
                else if (typeof options[key] === "boolean")
                {
                    options[key] = (tokens[1].toLowerCase() === "true");
                }
                else if (typeof options[key] === "number")
                {
                    options[key] = Number.parseFloat(tokens[1]);
                }
                else //assume string
                {
                    options[key] = tokens[1];
                }
            }
            else
            {
                let trimmedArg = arg.trim();
                if (trimmedArg === "/?" || trimmedArg === "help" || trimmedArg === "-?")
                {
                    options.help = true;
                }
                else
                {
                    options.sources.push(arg);
                }
            }  
        } 

        if (args.length === 0)
        {
            options.usage = true;
        }
    }  

    static Groom(options)
    {
        //perform any last minute grooming of the options
        OptionsLoader._groomForCaseSensitivity(options);
    }

    static _groomForCaseSensitivity(options)
    {
        if (options.i === true)
        {
            //replace list with lower case list for case-insensitive compare
            options.xx = OptionsLoader._toLowerCaseList(options.xx);
            options.xd = OptionsLoader._toLowerCaseList(options.xd);
            options.xn = OptionsLoader._toLowerCaseList(options.xn);            
        }
    }

    static _toLowerCaseList(items)
    {
        let list = [];
        for (let item of items)
        {
            list.push(item.toLowerCase());
        }
        return list;
    }
}
