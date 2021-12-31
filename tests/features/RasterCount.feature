Feature: Code Count
    Scenario: Count Code in file using Raster Method
        Given the code in '<file>'
        When I run a raster count
        Then there are <files> files
        * containing <blanks> blank lines
        * <comments> lines of comments
        * <code> lines of code
        * writen in the language '<language>'
        Examples:
            | file                      | language              | files | blanks | comments | code | 
            | js/no-comments.js         | JavaScript            | 1     | 5      | 0        | 35   |
            | js/two-simple-comments.js | JavaScript            | 1     | 5      | 1        | 35   |
            
