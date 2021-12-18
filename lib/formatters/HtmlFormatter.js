const {EOL} = require('os');
const fs = require("fs");
const path = require("path");
const StopWatch = require('../StopWatch');

module.exports = class HtmlFormatter
{
    Format(jsonResults)
    {
        //creates simple HTML without the need for a library import
        this._formatTimings(jsonResults.timing);
        let formattedOutput = '<!DOCTYPE html>' + EOL;
        formattedOutput += "<html>" + EOL;
        formattedOutput += "  <head>" + EOL;
        formattedOutput += "    <title>Code Count Results</title>" + EOL;
        formattedOutput += "    <style>" + EOL;
        formattedOutput += fs.readFileSync(path.join(__dirname, "default.css"));
        formattedOutput += "    </style>" + EOL;
        formattedOutput += "  </head>" + EOL;
        formattedOutput += "  <body>" + EOL;
        formattedOutput += "    <h1>Code Count Results</h1>" + EOL;

        formattedOutput += this._getTimingMarkup(jsonResults.timing);
        formattedOutput += this._getFilesMarkup(jsonResults.files);
        formattedOutput += this._getCodeMarkup(jsonResults);
   
        formattedOutput += "  </body>" + EOL;
        formattedOutput += "</html>" + EOL;
        return formattedOutput;
    }

    _getTimingMarkup(times)
    {
        let formattedOutput = "";
        formattedOutput += "    <h2>Times</h2>" + EOL;
        formattedOutput += "    <table>" + EOL;
        formattedOutput += "      <tr>" + EOL;
        formattedOutput += "        <th>Folder Scan</th>" + EOL;
        formattedOutput += "        <th>Make Unique</th>" + EOL;
        formattedOutput += "        <th>Disambiguate</th>" + EOL;
        formattedOutput += "        <th>Filter Rules</th>" + EOL;
        formattedOutput += "        <th>All Analysis</th>" + EOL;
        formattedOutput += "        <th>Total</th>" + EOL;
        formattedOutput += "      </tr>" + EOL;
        formattedOutput += "      <tr>" + EOL;
        formattedOutput += `        <td>${times.folderScan}</td>` + EOL;
        formattedOutput += `        <td>${times.removeDuplicates}</td>` + EOL;
        formattedOutput += `        <td>${times.disambiguation}</td>` + EOL;
        formattedOutput += `        <td>${times.analysis}</td>` + EOL;
        formattedOutput += `        <td>${times.codeScan}</td>` + EOL;
        formattedOutput += `        <td>${times.total}</td>` + EOL;
        formattedOutput += "      </tr>" + EOL;
        formattedOutput += "    </table>" + EOL;
        return formattedOutput;
    }

    _getFilesMarkup(files)
    {
        let formattedOutput = "";
        formattedOutput += "    <h2>Files</h2>" + EOL;
        formattedOutput += "    <table>" + EOL;
        formattedOutput += "      <tr>" + EOL;
        formattedOutput += "        <th>Unrecognized</th>" + EOL;
        formattedOutput += "        <th>Ignored</th>" + EOL;
        formattedOutput += "        <th>Recognized</th>" + EOL;
        formattedOutput += "        <th>Unique</th>" + EOL;
        formattedOutput += "        <th>Total</th>" + EOL;
        formattedOutput += "      </tr>" + EOL;
        formattedOutput += "      <tr>" + EOL;
        formattedOutput += `        <td>${files.unrecognized}</td>` + EOL;
        formattedOutput += `        <td>${files.ignored}</td>` + EOL;
        formattedOutput += `        <td>${files.recognized}</td>` + EOL;
        formattedOutput += `        <td>${files.unique}</td>` + EOL;
        formattedOutput += `        <td>${files.total}</td>` + EOL;
        formattedOutput += "      </tr>" + EOL;
        formattedOutput += "    </table>" + EOL;
        return formattedOutput;
    }

    _getCodeMarkup(jsonResults)
    {
        let formattedOutput = "";
        formattedOutput += "    <h2>Code</h2>" + EOL;
        formattedOutput += "    <table>" + EOL;
        formattedOutput += "      <tr>" + EOL;
        formattedOutput += "        <th>Language</th>" + EOL;
        formattedOutput += "        <th>Files</th>" + EOL;
        formattedOutput += "        <th>Blank</th>" + EOL;
        formattedOutput += "        <th>Comment</th>" + EOL;
        formattedOutput += "        <th>Code</th>" + EOL;
        formattedOutput += "        <th>Total</th>" + EOL;
        formattedOutput += "      </tr>" + EOL;

        const languageKeys = Object.keys(jsonResults.counts);
        languageKeys.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}))

        let totalFiles = 0;

        for (let languageId of languageKeys)
        {
            const item = jsonResults.counts[languageId];
            formattedOutput += "      <tr>" + EOL;
            formattedOutput += `        <td>${languageId}</td>` + EOL;
            formattedOutput += `        <td>${item.files}</td>` + EOL;
            formattedOutput += `        <td>${item.blank}</td>` + EOL;
            formattedOutput += `        <td>${item.comment}</td>` + EOL;
            formattedOutput += `        <td>${item.code}</td>` + EOL;
            formattedOutput += `        <td>${item.total}</td>` + EOL;
            formattedOutput += "      </tr>" + EOL;
            totalFiles += item.files;
        }

        const totalTitle = `${languageKeys.length} LANGUAGE TOTAL`;

        formattedOutput += "      <tfoot>" + EOL;
        formattedOutput += "        <tr>" + EOL;
        formattedOutput += `          <td>${totalTitle}</td>` + EOL;
        formattedOutput += `          <td>${totalFiles}</td>` + EOL;
        formattedOutput += `          <td>${jsonResults.totals.blank}</td>` + EOL;
        formattedOutput += `          <td>${jsonResults.totals.comment}</td>` + EOL;
        formattedOutput += `          <td>${jsonResults.totals.code}</td>` + EOL;
        formattedOutput += `          <td>${jsonResults.totals.lines}</td>` + EOL;
        formattedOutput += "        </tr>" + EOL;
        formattedOutput += "      </tfoot>" + EOL;
        formattedOutput += "    </table>" + EOL;
        return formattedOutput;
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
