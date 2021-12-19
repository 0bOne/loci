const StopWatch = require("../StopWatch");

module.exports = class JsonFormatter
{
    Format(jsonResults)
    {
        this._formatTimings(jsonResults.timing);

        let output = {
            times: {
                folderScan:   jsonResults.timing.folderScan,
                makeUnique:   jsonResults.timing.removeDuplicates,
                disambiguate: jsonResults.timing.disambiguation,
                filterRules:  jsonResults.timing.analysis,
                allAnalysis:  jsonResults.timing.codeScan,
                total:        jsonResults.timing.total
            },
            files: {
                unrecognized: jsonResults.files.unrecognized, 
                ignored: jsonResults.files.ignored, 
                recognized: jsonResults.files.recognized, 
                unique: jsonResults.files.unique, 
                total: jsonResults.files.total
            },
            code: []
        };

        const languageKeys = Object.keys(jsonResults.counts);
        languageKeys.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}))

        let totalFiles = 0;

        for (let languageId of languageKeys)
        {
            const item = jsonResults.counts[languageId];
            output.code.push({
                "language": languageId,
                "files": item.files,
                "blank": item.blank,
                "comments": item.comment,
                "code": item.code,
                "total": item.total
            });

            totalFiles += item.files;
        }

        output.totals = {
            languages: languageKeys.length,
            files: totalFiles,
            blank: jsonResults.totals.blank,
            comments: jsonResults.totals.comment,
            code: jsonResults.totals.code, 
            lines: jsonResults.totals.lines
        };

        return JSON.stringify(output, null, "\t");
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
