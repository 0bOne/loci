const fs = require("fs");
const path = require("path");

module.exports = class OptionsLoader
{
    static Load(userOptions)
    {
        const fileSpec = path.resolve(__dirname, "data", "default-options.json");
        const rawJSON = fs.readFileSync(fileSpec, "utf-8");
        const defaultOptions = JSON.parse(rawJSON);
        const combinedOptions = Object.assign(defaultOptions, userOptions);
        OptionsLoader._groomOptions(combinedOptions);
        return combinedOptions;
    }

    static _groomOptions(options)
    {
        options.exclude_dir = OptionsLoader._toTrimmedArray(options.exclude_dir);
    }

    static _toTrimmedArray(value)
    {
        if (typeof value === "string")
        {
            const items = value.split(",");
            const trimmedItems = [];
            for(const item of items)
            {
                trimmedItems.push(item.trim());
            }
            return trimmedItems;
        }
        return value;
    }


}