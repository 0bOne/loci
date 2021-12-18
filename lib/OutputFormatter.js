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
                const jsonFormatter = new JsonFormatter();   
                formattedOutput = jsonFormatter.Format(jsonResults);
                break;
             case "text":
                const textFormatter = new TextFormatter();
                formattedOutput = textFormatter.Format(jsonResults);
                break; 
            case "xml":
                const xmlFormatter = new XmlFormatter();
                formattedOutput = xmlFormatter.Format(jsonResults);   
                break;   
            case "html":
                const htmlFormatter = new HtmlFormatter();
                formattedOutput = htmlFormatter.Format(jsonResults);
                break;   
            default:
                console.log("unsupported output format: " + this._options.format);
                process.exit(1);
        }

        return formattedOutput;
    }


}
