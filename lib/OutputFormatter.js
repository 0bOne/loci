module.exports = class OutputFormatter
{
    _options;
    _logger;
    constructor(options, logger)
    {
        this._options = options;
        this._logger = logger;
    }

    Format(output)
    {
        let formattedOutput = "";
        switch(this._options.format)
        {
            case "text":
                formattedOutput = this._formatAsText(output);
                break;
            case "json":
                formattedOutput = JSON.stringify(output, null, "\t");
                break;
            default:
                console.log("unsupported output format: " + this._options.format);
                process.exit(1);
        }

        return formattedOutput;
    }

    _makeTextTableRow(columnWidth, values)
    {
        let row = " ";
        for (let value of values)
        {
            row+= value.toString().padStart(columnWidth, " ") + " ";
        }
        return row + "\r\n";
    }

    _makeTextTableLine(columnWidth, columnCount)
    {
        let row = "-";
        for (let i = 0; i < columnCount; i++)
        {
            row += "-".repeat(columnWidth) + "-";
        }
        return row + "\r\n";
    }


    _formatAsText(output)
    {
        let formattedOutput = "Files:\r\n";
        formattedOutput += this._makeTextTableLine(13, 5);
        formattedOutput += this._makeTextTableRow(13, ["Total", "Unique", "Unrecognized", "Recognized", "Ignored"]);
        formattedOutput += this._makeTextTableLine(13, 5);
        formattedOutput += this._makeTextTableRow(13, [output.files.total, output.files.unique, output.files.unrecognized,output.files.recognized, output.files.ignored]);
        formattedOutput += this._makeTextTableLine(13, 5);

        
        return formattedOutput;
    }

}