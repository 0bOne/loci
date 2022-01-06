const {EOL} = require('os');
const StopWatch = require("../StopWatch");

module.exports = class XmlFormatter
{
    Format(jsonResults)
    {
        let formattedOutput = "";

        if (jsonResults.timing || jsonResults.files || jsonResults.counts || jsonResults.totals)
        {
            //creates simple XML without the need for an XML library
            formattedOutput = '<?xml version="1.0" encoding="UTF-8"?>' + EOL;
            formattedOutput += "<Root>" + EOL;

            if (jsonResults.timing)
            {
                this._formatTimings(jsonResults.timing);
                formattedOutput += this._getTimingNode(jsonResults.timing);
            }
            if (jsonResults.files)
            {
                formattedOutput += this._getFilesNode(jsonResults.files);
            }
            if (jsonResults.counts)
            {
                formattedOutput += this._getCountsNodes(jsonResults.counts);
            }
            if (jsonResults.totals)
            {
                formattedOutput += this._getTotalsNode(jsonResults.totals);
            }
    
            formattedOutput += "</Root>" + EOL;
        }
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

    _getCountsNodes(counts)
    {
        let formattedOutput = "  <Counts>" + EOL;

        const languageKeys = Object.keys(counts);
        languageKeys.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}))

        for (let languageId of languageKeys)
        {
            const item = counts[languageId];
            formattedOutput += "    <Language";
            formattedOutput += ` files="${item.files}"`;
            formattedOutput += ` blank="${item.blank}"`;
            formattedOutput += ` comments="${item.comment}"`;
            formattedOutput += ` code="${item.code}"`;
            formattedOutput += ` total="${item.total}"`;
            formattedOutput += " >" + languageId + "</Language>" + EOL;
        }
        formattedOutput += "  </Counts>" + EOL;
        return formattedOutput;
    }

    _getTotalsNode(totals)
    {

        let formattedOutput = "  <Totals";
        formattedOutput += ` languages="${totals.languages}"`;
        formattedOutput += ` files="${totals.files}"`;
        formattedOutput += ` comments="${totals.comment}"`;
        formattedOutput += ` code="${totals.code}"`;
        formattedOutput += ` lines="${totals.lines}"`;
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
