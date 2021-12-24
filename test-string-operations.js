const StringHelpers = require("./lib/StringHelpers");

const twoRemovableTwoeNotEcapeChar = "string 'containing a quote and \\'escape char' and two //removable comments//' but //(not these two//)";
TestCommentsInStrings(twoRemovableTwoeNotEcapeChar, "'", "//", "\\", "string 'containing a quote and \\'escape char' and two   removable comments  ' but //(not these two//)");

const twoRemovableCommentsEcapeChar = "string 'containing a quote and \\'escape char' and //two removable// comments' inside";
TestCommentsInStrings(twoRemovableCommentsEcapeChar, "'", "//",  "\\", "string 'containing a quote and \\'escape char' and   two removable   comments' inside");

const noCommentsEcapeChar = "string 'containing a quote and \\'escape char' but no comment";  //have to double the esc char for it to be taken literally
TestCommentsInStrings(noCommentsEcapeChar, "'", "//",  "\\", noCommentsEcapeChar);


const twoRemovableTwoeNot = "string 'containing a quote and two //removable comments//' but //(not these two//)";
TestCommentsInStrings(twoRemovableTwoeNot, "'", "//", "\\", "string 'containing a quote and two   removable comments  ' but //(not these two//)");

const twoRemovableComments = "string 'containing a quote and //two removable// comments' inside";
TestCommentsInStrings(twoRemovableComments, "'", "//",  "\\", "string 'containing a quote and   two removable   comments' inside");

const oneRemovableOneNot = "string 'containing a quote and one //removable comment' but //(not this one)";
TestCommentsInStrings(oneRemovableOneNot, "'", "//", "\\", "string 'containing a quote and one   removable comment' but //(not this one)");

const oneRemovableComment = "string 'containing a quote and one //removable comment' inside.";
TestCommentsInStrings(oneRemovableComment, "'", "//", "\\", "string 'containing a quote and one   removable comment' inside.");

const noRemovableComment = "a string 'containing a quote' and //no removable comment";
TestCommentsInStrings(noRemovableComment, "'", "//",  "\\", noRemovableComment);

const noComments = "string 'containing a quote' but no comment";
TestCommentsInStrings(noComments, "'", "//",  "\\", noComments);

const nestedUnterminated = "I said 'it is (time (again)) to stop. Did I (not)?";
TestRmString(nestedUnterminated, "'", "(", ")", "I said 'it is  to stop. Did I ?")

const parentheses = "I said 'it is time (again) to stop.' Did I not?";
TestRmString(parentheses, "'", "(", ")", "I said 'it is time  to stop.' Did I not?")

const nestedInQuotes = "I said 'it is (time (again)) to stop.' Did I (not)?";
TestRmString(nestedInQuotes, "'", "(", ")", "I said 'it is  to stop.' Did I (not)?")

const nestedBraces = "The (quick (brown) fox) jumps (over the) lazy dog";
TestBetween(nestedBraces, '(', ')', "The  jumps  lazy dog");

const sequences = 'The <<quick>> brown <<fox jumps>> over the lazy dog'
TestBetween(sequences, '<<', '>>', "The  brown  over the lazy dog");

const multiples = 'The "quick" brown "fox jumps" over the "lazy" dog'
TestBetween(multiples, '"', '"', "The  brown  over the  dog");

const toBeQuote = "To be or not to be 'that' is the question";
TestBetween(toBeQuote, "'", "'", "To be or not to be  is the question");

const brownFox = "The quick brown fox jumps over the lazy dog";
TestBetween(brownFox, "brown", "lazy", "The quick  dog");
TestBetween(brownFox, "brown", "", "The quick "); //truncate to end


console.log("all tests passed!");


function TestCommentsInStrings(content, quoteSequence, commentSequence, escapeSequence, expected)
{
    const returned = StringHelpers.MaskWithinStrings(content, quoteSequence, commentSequence, escapeSequence);
    if (returned !== expected)
    {
        console.error("Unexpected 'Comment-in-String' result:");
        console.error("  expected: " + expected);
        console.error("  returned: " + returned);
        process.exit(1);
    }
    console.log("Test passed: " +expected );
}

function TestRmString(content, marker, lhs, rhs, expected)
{
    const returned = StringHelpers.RemoveWithinAllStringConstants(content, marker, lhs, rhs);
    if (returned !== expected)
    {
        console.error("Unexpected 'Between' result:");
        console.error("  expected: " + expected);
        console.error("  returned: " + returned);
        process.exit(1);
    }
    console.log("Test passed: " +expected );
}

function TestBetween(content, lhs, rhs, expected)
{
    const returned = StringHelpers.InclusiveRemoveBetween(content, lhs, rhs);
    if (returned !== expected)
    {
        console.error("Unexpected 'Between' result:");
        console.error("  expected: " + expected);
        console.error("  returned: " + returned);
        process.exit(1);
    }
    console.log("Test passed: " +expected );
}