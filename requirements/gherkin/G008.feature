
  Scenario: User accesses their achievements and sees their unlocked badges
    Given the user navigates to the "Sign In" page
    When the user signs in with email "chithien.nguyen@germangains.com" and password "password123"
    Then the "Main Page" page should be opened
    When the user is on the "main" page
    And the user clicks the "Achievements" button right sidebar
    Then the "Achievements" page should be opened
    And the "Your Badges" section should be visible
