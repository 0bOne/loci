const {EOL} = require('os');
const StopWatch = require("../StopWatch");

module.exports = class XmlFormatter
{
    Format(jsonResults)
    {
        //creates simple XML without the need for an XML library
        this._formatTimings(jsonResults.timing);
        let formattedOutput = '<?xml version="1.0" encoding="UTF-8"?>' + EOL;
        formattedOutput += "<Root>" + EOL;

        formattedOutput += this._getTimingNode(jsonResults.timing);
        formattedOutput += this._getFilesNode(jsonResults.files);
        formattedOutput += this._getCountsNodes(jsonResults);
        formattedOutput += this._getTotalsNode(jsonResults);
   
        formattedOutput += "</Root>" + EOL;
        return formattedOutput;
    }

    _getTimingNode(times)
    {
        let formattedOutput = "  <Times";
        formattedOutput += ` folderScan="${times.folderScan}"`;
        formattedOutput += ` makeUnique="${times.removeDuplicates}"`;
        formattedOutput += ` disambiguate="${times.disambiguation}"`;
        formattedOutput += ` filterRules="${times.analysis}"`;
        formattedOutput += ` allAnalysis="${times.codeScan}"`;
        formattedOutput += ` total="${times.total}"`;
        formattedOutput += " />" + EOL;

        return formattedOutput;
    }

    _getFilesNode(files)
    {
        let formattedOutput = "  <Files";
        formattedOutput += ` unrecognized="${files.unrecognized}"`;
        formattedOutput += ` ignored="${files.ignored}"`;
        formattedOutput += ` recognized="${files.recognized}"`;
        formattedOutput += ` unique="${files.unique}"`;
        formattedOutput += ` total="${files.total}"`;
        formattedOutput += " />" + EOL;
        return formattedOutput;
    }

    _getCountsNodes(jsonResults)
    {
        let formattedOutput = "  <Counts>" + EOL;

        const languageKeys = Object.keys(jsonResults.counts);
        languageKeys.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}))

        let totalFiles = 0;

        for (let languageId of languageKeys)
        {
            const item = jsonResults.counts[languageId];
            formattedOutput += "    <Language";
            formattedOutput += ` files="${item.files}"`;
            formattedOutput += ` blank="${item.blank}"`;
            formattedOutput += ` comments="${item.comment}"`;
            formattedOutput += ` code="${item.code}"`;
            formattedOutput += ` total="${item.total}"`;
            formattedOutput += " >" + languageId + "</Language>" + EOL;
            totalFiles += item.files;
        }
        formattedOutput += "  </Counts>" + EOL;
        return formattedOutput;
    }

    _getTotalsNode(jsonResults)
    {
        let totalFiles = 0;
        let languages = 0;

        for (let languageId in jsonResults.counts)
        {
            const item = jsonResults.counts[languageId];
            totalFiles += item.files;
            languages++;
        }

        let formattedOutput = "  <Totals";
        formattedOutput += ` languages="${languages}"`;
        formattedOutput += ` files="${totalFiles}"`;
        formattedOutput += ` comments="${jsonResults.totals.comment}"`;
        formattedOutput += ` code="${jsonResults.totals.code}"`;
        formattedOutput += ` lines="${jsonResults.totals.lines}"`;
        formattedOutput += " />" + EOL;
        return formattedOutput;

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
