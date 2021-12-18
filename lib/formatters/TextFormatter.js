const StopWatch = require("../StopWatch");
const {EOL} = require('os');

module.exports = class TextFormatter
{

    Format(jsonResults)
    {
        this._formatTimings(jsonResults.timing);
        let formattedOutput = "";

        formattedOutput += this._getTimingTable(jsonResults.timing);
        formattedOutput += this._getFilesTable(jsonResults.files);
        formattedOutput += this._getLanguageTable(jsonResults.counts, jsonResults.totals);
   
        return formattedOutput;
    }

    _getLanguageTable(counts, totals)
    {

        let formattedOutput = "Code:" + EOL;

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

        const dottedLine = this._makeLanguageLine(firstColumnWidth, 10, titles.length);;
        formattedOutput += dottedLine;
        formattedOutput += this._makeLanguageRow(firstColumnWidth, 10, titles);
        formattedOutput += dottedLine;

        for (let languageId of languageKeys)
        {
            const item = counts[languageId];
            formattedOutput += this._makeLanguageRow(firstColumnWidth, 10, [languageId, item.files, item.blank, item.comment, item.code, item.total]);

            totalFiles += item.files;
        }

        formattedOutput += dottedLine;
        formattedOutput += this._makeLanguageRow(firstColumnWidth, 10, [totalTitle, totalFiles, totals.blank, totals.comment, totals.code, totals.lines]);
        formattedOutput += dottedLine;

        return formattedOutput;

    }

    _getTimingTable(times)
    {
        let formattedOutput = "Times:" + EOL;
        formattedOutput += this._makeLine(14, 6);
        formattedOutput += this._makeRow(14, ["Folder Scan", "Make Unique", "Disambiguate", "Filter Rules", "All Analysis", "Total"]);
        formattedOutput += this._makeLine(14, 6);
        formattedOutput += this._makeRow(14, [times.folderScan, times.removeDuplicates, times.disambiguation, 
                                                        times.analysis, times.codeScan, times.total]);
        formattedOutput += this._makeLine(14, 6);

        return formattedOutput;
    }

    _getFilesTable(files)
    {
        let formattedOutput = "Files:" + EOL;
        formattedOutput += this._makeLine(13, 5);
        formattedOutput += this._makeRow(13, ["Unrecognized", "Ignored", "Recognized", "Unique", "Total"]);
        formattedOutput += this._makeLine(13, 5);
        formattedOutput += this._makeRow(13, [files.unrecognized, files.ignored, files.recognized, files.unique, files.total]);
        formattedOutput += this._makeLine(13, 5);

        return formattedOutput;
    }

    _makeRow(columnWidth, values)
    {
        let row = " ";
        for (let value of values)
        {
            row+= value.toString().padStart(columnWidth, " ") + " ";
        }
        return row + EOL;
    }

    _makeLanguageRow(firstColumnWidth, columnWidth, values)
    {
        let row = " ";
        let width = firstColumnWidth;
        for (let value of values)
        {
            row+= value.toString().padStart(width, " ") + " ";
            width = columnWidth;
        }
        return row + EOL;
    }

    _makeLanguageLine(firstColumnWidth, columnWidth, columnCount)
    {
        let row = "-";
        let width = firstColumnWidth;
        for (let i = 0; i < columnCount; i++)
        {
            row += "-".repeat(width) + "-";
            width = columnWidth;
        }
        return row + EOL;
    }

    _makeLine(columnWidth, columnCount)
    {
        let row = "-";
        for (let i = 0; i < columnCount; i++)
        {
            row += "-".repeat(columnWidth) + "-";
        }
        return row + EOL;
    }

    _formatTimings(timing)
    {
        const DECIMAL_PLACES = 2;

        for (let propertyName in timing)
        {
            timing[propertyName] = StopWatch.ToSeconds(timing[propertyName], DECIMAL_PLACES) + " s";
        }
    }

}
