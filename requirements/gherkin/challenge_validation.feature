
  Scenario: Challenge - Page Navigation
    Given the user goes to the "Sign In" page
    When the user logs in with their Credentials
    Then the "Main Page" page should be opened
    When the user clicks the "Challenge" button
    Then the "Challenge" page should be opened
    And the "All" button should be visible
    And the "Grammar" button should be visible
    And the "Vocabulary" button should be visible
    And the "Listening" button should be visible
    And the "Numbers" button should be visible
    And the "Speaking" button should be visible
    When the user clicks the "Grammar" button
    Then the "Grammar" button should be visible
    When the user clicks the "Vocabulary" button
    Then the "Vocabulary" button should be visible
    When the user clicks the "Listening" button
    Then the "Listening" button should be visible
    When the user clicks the "Numbers" button
    Then the "Numbers" button should be visible
    When the user clicks the "Speaking" button
    Then the "Speaking" button should be visible