# Loci - Lines of Code Inventorizer

## Key Features
- Command Line Mode or NPM Library
- Command Line can take environment variables or switches
- Multiple output formats: Text, JSON, XML, HTML, CSV
- Over 200 languages supported
- Modern stacks like Node, Angular, Vue, C#, Terraform
- Automatic disambiguation where file could be more than one language
- Override disambiguation for speed with command line switches
- Multiple threads and automatic single/multi-thread detetion based on file count
- Faster than Cloc in most scenarios

## NPM Location

https://www.npmjs.com/package/@0b1.org/loci

## History
I have been a huge fan of [Cloc](https://github.com/AlDanial/cloc) for many years.  In fact, I have used it so often on new projects that other code counters just don't give me the confidence: Any other code counter and I would be "comparing apples to oranges" - they don't all give the same results.

Unfortunately many environments don't allow custom binaries, ruling out cloc as a Perl script AND cloc.exe.   

Node, however, is more prevalent, so I decided to see if I could create a close cousin of cloc written in node.

I think I succeeeded, but the Open Source community will be the ultimate judge.

There is still a few minor differences between the two.  Loci excludes the folders bin, obj and .vscode by default, whereas Cloc does not.  Cloc also has a very mature feature list that Loci does not: git repo querying, diffs, sql generation.  If you need those features, [Cloc](https://github.com/AlDanial/cloc) remains the better choice.

Cloc is faster on smaller groups of files but only by fractions of a second.  For bulk scanning Loci invokes worker threads so that counting can continue without waiting for file i/o.   

In Cloc definitions are spread throughout the Perl functions, but in Loci definitions fare stored as YAML definition files. This means new languages can be added quickly and easily.  And at ~7,500 lines of SOLID code = data to CLOC's 17,000 lines in a single script, its a little more maintainable, imo.


## Performance

Performance comparisons show Loci outperforming Cloc at almost all code sizes

![Comparison Chart](https://github.com/0bOne/loci/blob/main/performance-chart.png)

## Command-Line Usage

To install for command line usage, enter the command 

```>npm install -g @0b1.org/loci```

To remove the CLI, enter the command 

```npm remove -g @0b1.org/loci```

Basic help:     

- Show help on basic usage and switches: ```loci --help```
- Show help on environment variables: ```loci --show:environmentals```
- Show the default options: ```loci --show:defaults```
- Show the current options: ```loci --show:options```  (includes any command line switches and selected folders)
- Show the language definitions: ```loci --show:languages```

Basic scanning:
- Scan a folder with default options ```loci c:\_dev\OLD_CODE\uisdk```
- Scan unique files in the folder    ```loci --unique c:\_dev\OLD_CODE\uisdk```
- Scan, but exclude folders named 'backup' ```loci --unique --xd:+backup c:\_dev\OLD_CODE\uisdk```
- Scan, but exclude ONLY folders named 'backup' ```loci --unique --xd:backup c:\_dev\OLD_CODE\uisdk```
    - (note the + symbol means, add these to the default excludes, but a missing + symbol means replace the defaults)

Separated lists in switches with semicolons. Separate lists of folders to scan with spaces.
(if your folder names have spaces, wrap them in double quotes)

Link to full help:
https://github.com/0bOne/loci/blob/main/lib/data/help/basic-usage.txt

Environment Variable information:
https://github.com/0bOne/loci/blob/main/lib/data/help/environmentals.txt


## Library Usage

You can include the npm package in your own project.

In your current project enter the command ```npm install @0b1.org/loci```

For the simplest use, which just wraps the CLI, use:
```
const Loci = require ("@0b1.org/loci/lib/Loci");
Loci.CLIScan();
```

And you can run your own code as though it were Loci:

```node index.js --unique .```

This, of course, is not much use. A more complete program would look like this:

```
    const Loci = require ("@0b1.org/loci/lib/Loci");

    const options = Loci.LoadDefaultOptions();
    options.sources.push("scan_this_folder);
    options.xf.push("not_this_subfolder");
    options.threads = 5;

    //the default logger logs to the console. 
    //Or pass in your own logger implementing the same methods
    const logger = Loci.GetLogger(options);
        
    //instantiate and scan
    const scanner = new Loci(logger);      
    const output = scanner.Scan(options);
        
    //format and display the output. 
    //Alternatively, process the json object elsewhere in your project.
    const formatter = Loci.GetFormatter(options);
    const textResult = formatter.Format(output);
    Loci.Output(textResult, options);
```

That's it! Happy coding!


## Reporting Issues or feature requests

Please inlude the command line switches, environment variables, or programmatic options.
If possible, also include the code file that loci did not process as expected.

PLEASE check the existing bug list before submitting

If you would like a language added, you can experiment yourself by editing languages.yaml or send us some sample files.

You can contact me at sourcecoder0b1@gmail.com


## Contributing

Even a small open source project like this takes a fair amount of time.
If you would like to contribute, please let me know!

The license is MIT, so feel free to branch and experiment as you please. 
(But bear in mind it is benefits the community more if one project is improved than if multiple derivations exist)


## Compatibility

- Tested on node v16.0.0

## Known Issues

- Only tested on windows and Linux
- Only runs in single-threaded mode on Node versions lower than 15.0.0. No intent to fix.
- Cucumber test fails (for Robot language only) in node 14.0.0 (passes in higher versions)

## Release Notes

### Version 1.0.7
- Added scale factor option
- Added --to: switch for output to file
- Added --supress switch for aSuppression of output components (times, files, code counts, totals)
- Added raster count support for XML, XSD
- Fixed - files being opened rw in certain circumstances, causing exceptions in certain circumstances
- Fixed - not ignoring node_modules folders and some others
- Fixed - zero value in indicidual code counts regression introduced in 1.0.6

### Version 1.0.6
- Added static methods to Loci to get logger, formatter, and default options, so that only Loci module need be imported
- Added --tf switch to control single/multi threaded mode file count cut-off point.
- Defaulted -tf switch to 3500 based on 1.0.5 benchmark tests for likely best performance.
- Remvove several obsolete files from source
- Changed Loci instance scan method from 'Begin' to 'Scan' for improved readability
- Added disambiguate by Shebang scoring rule
- Added disambiguation rules for Ant/XML, Maven/XML, Verilog-SystemVerilog/Coq, and D/dtrace
- Added CSV output format

### Version 1.0.5
- Addex experimental Raster scan for JavaScript only (approx 10-20% performance gain over RegEx)
- Refactored File Processing & regognition for readability and performance gain
- Refactored Unique file determination algorithm for significant performance gains (>75%)
- Added more granular benchmark graph to readme.

### Version 1.0.4
- Fixed: works with Node 14.0.0 
- Fixed: The filter processing time exceeds the total processing time in multi-threaded mode
- String tests migrated to Cucumber
- Tested on Ubuntu Server 20.04.03 LTS running Node 16.13.1

### Version 1.0.3
- Fixed: RTE scanning empty folder
- Fixed: Cucumber tests all fail
- Fixed: Verious ESLint styling issues
- Tested working on Node version 15.0.0 or higher
- Added version check to generate error and exit on node versions below 15.0.0

## Roadmap
- Raster scan support for all languages (ongoing effort)
- Custom XSLT, JSON Transforms, and/or HTML CSS for results formatting
- Use .gitignore to filter out files and folders
- Custom definitions for disambiguation and languages
- Output (scanned, unique, ignored, etc) to activity list
- Output as SQL inserts
- Scan inside archives
- Additional languages (on request)
- Scan remote git repos

