  Scenario: Profile Validation
    Given the user navigates to the "Sign In" page
    When the user signs in with email "chithien.nguyen@germangains.com" and password "password123"
    Then the "Main Learning Page" page should be opened
    When the user clicks the "Menu Toggle" button
    And the user clicks the "Profile" button
    Then the "Profile" page should be opened
    And the "Header Card" list should be visible
    And the "Stats" list should be visible
    And the "Activity" list should be visible
    And the "Achievements" list should be visible
    And the "Saved Words" list should be visible
    When the user clicks the "Menu Toggle" button
    And the user clicks the "Profile" button
    Then the "Profile" page should be opened
    And the "Stat Xp" list should be visible
    And the "Stat Streak" list should be visible
    And the "Stat Level" list should be visible

