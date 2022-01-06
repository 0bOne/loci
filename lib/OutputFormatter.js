const CSVFormatter = require("./formatters/CSVFormatter");
const HtmlFormatter = require("./formatters/HtmlFormatter");
const JsonFormatter = require("./formatters/JsonFormatter");
const TextFormatter = require("./formatters/TextFormatter");
const XmlFormatter = require("./formatters/XmlFormatter");

module.exports = class OutputFormatter
{
    _options;
    _logger;

    constructor(options, logger)
    {
        this._options = options;
        this._logger = logger;
    }

    Format(jsonResults)
    {
        let formattedOutput = "";

        this._roundSCaledCounts(jsonResults);
        this._removeSuppressedComponents(jsonResults);

        switch(this._options.format)
        {
            case "raw":
                formattedOutput = JSON.stringify(jsonResults, null, "\t");
                break;
            case "json":         
                    formattedOutput = (new JsonFormatter()).Format(jsonResults);            
                break;
             case "text":
                formattedOutput = (new TextFormatter()).Format(jsonResults);
                break; 
            case "xml":
                formattedOutput = (new XmlFormatter()).Format(jsonResults);   
                break;   
            case "html":
                formattedOutput = (new HtmlFormatter()).Format(jsonResults);
                break;   
            case "csv":
                formattedOutput = (new CSVFormatter()).Format(jsonResults);
                break;
            default:
                console.log("unsupported output format: " + this._options.format);
                process.exit(1);
        }

        return formattedOutput;
    }

    _roundSCaledCounts(jsonResults)
    {
       if (this._options.scale === true)
       {
            for (let languageId in jsonResults.counts)
            {
                let language = jsonResults.counts[languageId];
                language.blank = Math.round(language.blank * 100) / 100;
                language.comment = Math.round(language.comment * 100) / 100;
                language.code = Math.round(language.code * 100) / 100;
                language.total = Math.round(language.total * 100) / 100;
            }

            jsonResults.totals.blank = Math.round(jsonResults.totals.blank * 100) / 100;
            jsonResults.totals.comment = Math.round(jsonResults.totals.comment * 100) / 100;
            jsonResults.totals.code = Math.round(jsonResults.totals.code * 100) / 100;
            jsonResults.totals.lines = Math.round(jsonResults.totals.lines * 100) / 100;
       }
    }

    _removeSuppressedComponents(jsonResults)
    {
        for (let name of this._options.suppress)
        {
            switch(name)
            {
                case "times":
                    delete jsonResults.timing;
                    break;
                case "files":
                    delete jsonResults.files;
                    break;
                case "code":
                    delete jsonResults.counts;
                    break;
                case "totals": 
                    delete jsonResults.totals;
                    break;
            }
        }
    }
}
