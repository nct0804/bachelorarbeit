
  Scenario: Main Page- Navigation and Validation
    Given the user navigates to the "Sign In" page
    When the user signs in with email "chithien.nguyen@germangains.com" and password "password123"
    Then the "Main Learning Page" page should be opened
    And the "Nav" list should be visible
    And the "Topbar" list should be visible
    When the user clicks the "Review" button
    And the "Rightbar" list should be visible
    And the "Learn" button should be visible
    And the "Start Challenge" button should be visible
    When the user clicks the "Challenge" button
    Then the "Challenge" page should be opened
    And the "All" button should be visible
    And the "Grammar" button should be visible
    And the "Vocabulary" button should be visible
    And the "Listening" button should be visible
    And the "Numbers" button should be visible
    And the "Speaking" button should be visible
    When the user clicks the "Ranking" button
    Then the "Ranking" page should be opened
    When the user clicks the "This Month" button
    And the user clicks the "All Time" button
    And the user clicks the "This Week" button
    When the user clicks the "Pronunciation" button
    Then the "Pronunciation" page should be opened
    And the "Group" list should be visible
    When the user clicks the "Speak" button
    Then the "Speak" page should be opened
    When the user clicks the "Inbox" button
    Then the "Inbox" page should be opened
    When the user clicks the "Achievements" button
    Then the "Achievements" page should be opened
    When the user clicks the "Menu Toggle" button
    And the user clicks the "Profile" button
    Then the "Profile" page should be opened
    And the "Header Card" list should be visible
    And the "Stats" list should be visible
    When the user clicks the "Menu Toggle" button
    And the user clicks the "About" button
    Then the "About Us" page should be opened
    When the user navigates to the "Main Page" page
    Then the "Main Page" page should be opened
    And the user clicks the "Menu Toggle" button
    And the "Logout" button should be visible
    When the user clicks the "Logout" button
    Then the "Logout Message" messagebox should be visible
    When the user clicks the "Log Out Continue" button
    Then the "Main Page" page should be opened

