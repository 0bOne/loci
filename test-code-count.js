const YAML = require("yaml");
const fs = require("fs");
const path = require("path");
const Loci = require("./lib/Loci");

let testSingleFolder = process.argv[2];

//testSingleFolder = "XmlToJSONSendPipeline.btp";
//testSingleFolder = "TypeScript_2.ts";

if (testSingleFolder)
{
    processTest(testSingleFolder, 1); 
    process.exit(1);
}

const samplesDir = path.resolve(__dirname, "tests", "samples");
const contents = fs.readdirSync(samplesDir);
let count = 1;
for (const possibleFolder of contents)
{
    const spec = path.resolve(samplesDir, possibleFolder);
    const stats = fs.lstatSync(spec);
    if (stats.isDirectory())
    {
        processTest(possibleFolder, count);
        count++;
    }
}

function processTest(folderName, count)
{
    const inputFolder = path.resolve(__dirname, "tests", "samples", folderName);
    
    console.log("counting folder: " + count + ": " + inputFolder);

    const jc = new Loci();
    const startTime = new Date();

    const output = jc.Begin([inputFolder], {debugFolder: path.resolve(__dirname, "tests/debug")});

    const endTime = new Date();
    const difference = endTime.getTime() - startTime.getTime();
    const seconds = Math.round(difference / 10) / 100;
    
    console.log("time taken: " + seconds + " s");
    console.log(output);

    const yamlFile = path.resolve(__dirname, "tests", "counts", folderName + ".yaml");
    let expectedCounts = loadYamlDoc(yamlFile);
    
    delete expectedCounts.header.cloc_url;
    delete expectedCounts.header.cloc_version;
    delete expectedCounts.header.files_per_second;
    delete expectedCounts.header.lines_per_second;
    delete expectedCounts.header.report_file;
    delete expectedCounts.header.elapsed_seconds;

    console.log(expectedCounts);

    for (let languageId in expectedCounts)
    {
        if (languageId !== "header" && languageId !== "SUM")
        {
            if (output.counts[languageId] === undefined)
            {
                console.error("Could not find counts for '" + languageId + "' in " + folderName);
                process.exit(1);
            }
        }
    }

    AssertEqual(expectedCounts.header.n_files, output.files.total, folderName +"/total files" );
    AssertEqual(expectedCounts.SUM.blank, output.totals.blank, folderName +"/total blank");
    AssertEqual(expectedCounts.SUM.comment, output.totals.comment, folderName +"/total comment");
    AssertEqual(expectedCounts.SUM.code, output.totals.code, folderName +"/total code");


    for (let languageId in output.counts)
    {
        const expected = expectedCounts[languageId];
        const actual = output.counts[languageId];
        AssertEqual(expected.nFiles, actual.files, folderName + "/" + languageId + "/files");
        AssertEqual(expected.blank, actual.blank, folderName + "/" + languageId + "/blank");
        AssertEqual(expected.comment, actual.comment, folderName + "/" + languageId + "/comment");
        AssertEqual(expected.code, actual.code, folderName + "/" + languageId + "/code");
        //ensure the total matches code+comment+blanks in the result:
        AssertEqual(actual.blank + actual.comment + actual.code, actual.total, folderName + "/" + languageId + "/total");
    }
}

function loadYamlDoc(fileName)
{
    const fileSpec = path.resolve(__dirname, "data", fileName);
    const rawYAML = fs.readFileSync(fileSpec, "utf-8");
    const documents = YAML.parseAllDocuments(rawYAML);   
    for (let doc of documents)
    {
        return doc.toJSON();
    }
}

function AssertEqual(expected, actual, what)
{
    if (expected !== actual)
    {
        console.error("Assert failed comparing '" + what + "'. Actual '" + actual + "' differs from expected '" + expected + "'");
        process.exit(1);
    }
}