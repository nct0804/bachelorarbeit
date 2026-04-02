  Scenario: Learn Session - Interaction and Validation
    Given the user navigates to the "Sign In" page
    When the user signs in with email "chithien.nguyen@germangains.com" and password "password123"
    Then the "Main Page" page should be opened
    And the user clicks the "Learn" button
    Then the "Learn" page should be opened
    When the user selects the "Option" list item at index "1"
    And the user clicks the "Check" button
    Then the "Check Result" messagebox should be visible
    When the user fills the "Blank Input" textbox with "uten" Value
    And the user clicks the "Check" button
    Then the "Check Result" messagebox should be visible
    Then the "Learn" page should be opened
    When the user selects the "Option" list item at index "7"
    And the user clicks the "Check" button
    Then the "Check Result" messagebox should be visible
    When the user clicks the "Try Again" button
    Then the "Learn" page should be opened
    When the user clicks the "Exit" button
    Then the "Exit Modal" messagebox should be visible
    When the user clicks the "Back to Home" button
    Then the "Main Page" page should be opened
