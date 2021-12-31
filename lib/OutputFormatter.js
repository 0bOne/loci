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


}
