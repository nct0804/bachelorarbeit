
  Scenario: Navigation Validation
    Given the user navigates to the "Sign In" page
    When the user signs in with email "chithien.nguyen@germangains.com" and password "password123"
    Then the "Main Learning Page" page should be opened
    And the "Nav" list should be visible
    And the "Topbar" list should be visible
    And the "Learn" button should be visible
    And the "Review" button should be visible
    And the "Challenge" button should be visible
    And the "Ranking" button should be visible
    And the "Pronunciation" button should be visible
    And the "Speak" button should be visible
    When the user clicks the "Inbox" button
    Then the "Inbox" page should be opened
    When the user clicks the "Speak" button
    Then the "Speak" page should be opened
    When the user clicks the "Achievements" button
    Then the "Achievements" page should be opened
    When the user clicks the "Menu Toggle" button
    And the user clicks the "About" button
    Then the "About Us" page should be opened
    When the user navigates to the "Main Page" page
    Then the "Main Page" page should be opened
    When the user clicks the "Menu Toggle" button
    And the "Logout" button should be visible
    When the user clicks the "Logout" button
    Then the "Logout Message" messagebox should be visible
    When the user clicks the "Log Out Continue" button
    Then the "Main Page" page should be opened
    And the "Start Challenge" button should be visible
    When the user clicks the "Start Challenge" button
    Then the "Challenge" page should be opened

