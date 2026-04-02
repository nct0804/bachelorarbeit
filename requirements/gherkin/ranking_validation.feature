  Scenario: Profile Validation
    Given the user navigates to the "Sign In" page
    When the user signs in with email "chithien.nguyen@germangains.com" and password "password123"
    Then the "Main Learning Page" page should be opened
    When the user clicks the "Ranking" button
    Then the "Ranking" page should be opened
    And the "Card" list should be visible
    And the "List" list should be visible
    And the "Tabs" tab should be visible
    When the user clicks the "This Week" button
    Then the "List" list should be visible
    When the user clicks the "This Month" button
    Then the "List" list should be visible
    When the user clicks the "All Time" button
    Then the "List" list should be visible

