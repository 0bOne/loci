Feature: String Operations
    Scenario: Between - Truncate to End
    Given the string 'The quick brown fox jumps over the lazy dog'
    When extracted between 'brown' and ''
    Then the result is 'The quick '

    Scenario: Between - Straight Extract
    Given the string 'The quick brown fox jumps over the lazy dog'
    When extracted between 'brown' and 'lazy'
    Then the result is 'The quick  dog'

    Scenario: Between Nested Braces
    Given the string 'The (quick (brown) fox) jumps (over the) lazy dog'
    When extracted between '(' and ')'
    Then the result is 'The  jumps  lazy dog'

    Scenario: Between Sequences
    Given the string 'The <<quick>> brown <<fox jumps>> over the lazy dog'
    When extracted between '<<' and '>>'
    Then the result is 'The  brown  over the lazy dog'

    Scenario: Between Multiples
    Given the string 'The "quick" brown "fox jumps" over the "lazy" dog'
    When extracted between '"' and '"'
    Then the result is 'The  brown  over the  dog'

    Scenario: Between Single Quotes
    Given the string "To be or not to be 'that' is the question"
    When extracted between "'" and "'"
    Then the result is "To be or not to be  is the question"

    Scenario: Remove in nested quotes
    Given the string "I said 'it is (time (again)) to stop.' Did I (not)?"
    When removed within "'" between '(' and ')'
    Then the result is "I said 'it is  to stop.' Did I (not)?"

    Scenario: Remove in Unterminated quotes
    Given the string "I said 'it is (time (again)) to stop. Did I (not)?"
    When removed within "'" between '(' and ')'
    Then the result is "I said 'it is  to stop. Did I ?"

    Scenario: Remove quoted in parenthesized
    Given the string "I said 'it is time (again) to stop.' Did I not?"
    When removed within "'" between '(' and ')'
    Then the result is "I said 'it is time  to stop.' Did I not?"

    Scenario: Mask qith no comments
    Given the string "string 'containing a quote' but no comment"
    When masking tokenized with quotes: "'" comments: "//", and escapes: "\\"
    Then there is no change

    Scenario: Mask qith no removable comment
    Given the string "a string 'containing a quote' and //no removable comment"
    When masking tokenized with quotes: "'" comments: "//", and escapes: "\\"
    Then there is no change

    Scenario: Mask qith one removable comment
    Given the string "string 'containing a quote and one //removable comment' inside."
    When masking tokenized with quotes: "'" comments: "//", and escapes: "\\"
    Then the result is "string 'containing a quote and one   removable comment' inside."

    Scenario: Mask qith one removable comment one not
    Given the string "string 'containing a quote and one //removable comment' but //(not this one)"
    When masking tokenized with quotes: "'" comments: "//", and escapes: "\\"
    Then the result is "string 'containing a quote and one   removable comment' but //(not this one)"

    Scenario: Mask qith two removable comments
    Given the string "string 'containing a quote and //two removable// comments' inside"
    When masking tokenized with quotes: "'" comments: "//", and escapes: "\\"
    Then the result is "string 'containing a quote and   two removable   comments' inside"

    Scenario: Mask qith two removable comments and two non-removable
    Given the string "string 'containing a quote and two //removable comments//' but //(not these two//)"
    When masking tokenized with quotes: "'" comments: "//", and escapes: "\\"
    Then the result is "string 'containing a quote and two   removable comments  ' but //(not these two//)"

    Scenario: Mask qith no comments and an escape character
    Given the string "string 'containing a quote and \\'escape char' but no comment"
    When masking tokenized with quotes: "'" comments: "//", and escapes: "\\"
    Then there is no change

    Scenario: Mask qith two removable comments and an escape character
    Given the string "string 'containing a quote and \\'escape char' and //two removable// comments' inside"
    When masking tokenized with quotes: "'" comments: "//", and escapes: "\\"
    Then the result is "string 'containing a quote and \\'escape char' and   two removable   comments' inside"

    Scenario: Mask qith two removable comments and an escape character
    Given the string "string 'containing a quote and \\'escape char' and two //removable comments//' but //(not these two//)"
    When masking tokenized with quotes: "'" comments: "//", and escapes: "\\"
    Then the result is "string 'containing a quote and \\'escape char' and two   removable comments  ' but //(not these two//)"

