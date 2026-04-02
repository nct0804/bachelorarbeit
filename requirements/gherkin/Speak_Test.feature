  Scenario: Sign Up Validation
    Given the user navigates to the "Sign In" page
    And the "Sign In" page should be opened
    When the user signs in with their Credentials
    Then the "Main Page" page should be opened
    When the user goes to the "Speak" page
    Then the "Speak" page should be opened
    When the user clicks the "Play Phrase" button
    Then Wait for "2" seconds
    Then clicks on the "New Phrase" button
    Then the user clicks the "Play Phrase" button
    And the user waits for "2" seconds