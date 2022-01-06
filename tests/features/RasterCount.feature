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
            | file                             | language   | files | blanks | comments | code |
            | js/no-comments.js                | JavaScript | 1     | 5      | 0        | 35   |
            | js/two-simple-comments.js        | JavaScript | 1     | 5      | 1        | 35   |
            | js/quotes-in-line-comments.js    | JavaScript | 1     | 5      | 3        | 35   |
            | js/quotes-in-block-comments.js   | JavaScript | 1     | 5      | 4        | 35   |
            | js/comments-in-comments.js       | JavaScript | 1     | 5      | 2        | 35   |
            | js/line-comments-in-blocks.js    | JavaScript | 1     | 5      | 4        | 35   |
            | js/block-comments-in-quotes.js   | JavaScript | 1     | 5      | 0        | 38   |
            | xml/no-comments.xml              | XML        | 1     | 0      | 0        | 5    |
            | xml/two-simple-comments.xml      | XML        | 1     | 0      | 1        | 5    |
            | xml/quotes-in-line-comments.xml  | XML        | 1     | 0      | 1        | 5    |
            | xml/quotes-in-block-comments.xml | XML        | 1     | 0      | 2        | 5    |
            | xml/comments-in-quotes.xml       | XML        | 1     | 0     | 0        | 5   |

