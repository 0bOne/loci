const {Given, When, Then} = require('@cucumber/cucumber');
const assert = require('assert');
const path = require('path');
const Loci = require('../../../lib/Loci');

Given('I have code in folder {string}', function (folderName) 
{    
    const sampleFolder = path.resolve(__dirname, "..", "..", "samples", "count", folderName);
    this.options = Loci.LoadDefaultOptions();
    this.options.threads = 1;
    this.options.sources.push(sampleFolder);
});

Given('the code in {string}', function (fileName) 
{    
    const fileSpec = path.resolve(__dirname, "..", "..", "samples", "rasterization", fileName);
    this.options = Loci.LoadDefaultOptions();
    this.options.threads = 1;
    this.options.sources.push(fileSpec);
});

When('I run a raster count', function () 
{
    this.options.raster = true;
    const logger = Loci.GetLogger(this.options);
    const scanner = new Loci(logger);
    const returned = scanner.Scan(this.options);

    this.results = {};

    //get the first language in the counts property
    for (let languageId in returned.counts)
    {
        this.results.language = languageId;
        this.results = Object.assign(this.results, returned.counts[languageId]);
        break;
    }
});

When('I run a code count', function () 
{
    //console.log(this.options);

    //this.options.verbosity = "thread";
    const logger = Loci.GetLogger(this.options);
    const scanner = new Loci(logger);
    const returned = scanner.Scan(this.options);

    //console.log(returned);

    this.results = {};

    //get the first language in the counts property
    for (let languageId in returned.counts)
    {
        this.results.language = languageId;
        this.results = Object.assign(this.results, returned.counts[languageId]);
        break;
    }
});

Then('there are {int} files', function (files) 
{
    assert.equal(this.results.files, files, "files");
});


Given('containing {int} blank lines', function (blanks) 
{
    assert.equal(this.results.blank, blanks, "blank lines");
});


Given('{int} lines of comments', function (comments) 
{
    assert.equal(this.results.comment, comments, "comment lines");
});

Given('{int} lines of code', function (code) 
{
    assert.equal(this.results.code, code, "lines");
});

Given('writen in the language {string}', function (language) 
{
    assert.equal(this.results.language, language, "language");
});

