const StopWatch = require("../StopWatch");
const {EOL} = require('os');
const StringHelpers = require("../StringHelpers");

module.exports = class CSVFormatter
{


    Format(jsonResults)
    {
        this.delimiters = {
            column: ",",
            row: EOL,
            string: '"',
            escape: "\\"
        };
        
        this._formatTimings(jsonResults.timing);
        let formattedOutput = "";

        formattedOutput += this._getTimingTable(jsonResults.timing);
        formattedOutput += this._getFilesTable(jsonResults.files);
        formattedOutput += this._getLanguageTable(jsonResults.counts, jsonResults.totals);
   
        return formattedOutput ;
    }

    _getLanguageTable(counts, totals)
    {
        let formattedOutput = this._makeRow(["Code:", null, null, null, null, null]);

        const languageKeys = Object.keys(counts);
        languageKeys.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}))

        const totalTitle = `${languageKeys.length} LANGUAGE TOTAL`;
 
        let totalFiles = 0;
        let firstColumnWidth = totalTitle.length;
        for (let languageId of languageKeys)
        {
            if (languageId.length > firstColumnWidth)
            {
                firstColumnWidth = languageId.length;
            }   
        }

        const titles = ["Language", "Files", "Blank", "Comments", "Code", "Total"];

        formattedOutput += this._makeRow(titles);

        for (let languageId of languageKeys)
        {
            const item = counts[languageId];
            formattedOutput += this._makeRow([languageId, item.files, item.blank, item.comment, item.code, item.total]);

            totalFiles += item.files;
        }

        formattedOutput += this._makeRow([totalTitle, totalFiles, totals.blank, totals.comment, totals.code, totals.lines]);

        return formattedOutput;

    }

    _getTimingTable(times)
    {
        let formattedOutput = this._makeRow(["Times:", null, null, null, null, null]);
        formattedOutput += this._makeRow(["Folder Scan", "Make Unique", "Disambiguate", "Filter Rules", "All Analysis", "Total"]);
        formattedOutput += this._makeRow([times.folderScan, times.removeDuplicates, times.disambiguation, 
                                                        times.analysis, times.codeScan, times.total]);

        return formattedOutput  + this.delimiters.row;
    }

    _getFilesTable(files)
    {
        let formattedOutput = this._makeRow(["Files:", null, null, null, null]);
        formattedOutput += this._makeRow(["Unrecognized", "Ignored", "Recognized", "Unique", "Total"]);
        formattedOutput += this._makeRow([files.unrecognized, files.ignored, files.recognized, files.unique, files.total]);
        return formattedOutput  + this.delimiters.row;
    }

    _makeRow(values)
    {
        let cells = [];
        for (let value of values)
        {
            if (typeof value === "string")
            {   
                value = value.split(this.delimiters.string).join(this.delimiters.escape + this.delimiters.string);
                value = this.delimiters.string + value + this.delimiters.string;
            }
            cells.push(value);
        }
        return cells.join(this.delimiters.column) + this.delimiters.row;
    }

    _formatTimings(timing)
    {
        const DECIMAL_PLACES = 2;

        for (let propertyName in timing)
        {
            timing[propertyName] = StopWatch.ToSeconds(timing[propertyName], DECIMAL_PLACES);
        }
    }
}
