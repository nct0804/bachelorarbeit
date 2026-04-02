  Scenario: Profile Validation
    Given the user navigates to the "Sign In" page
    When the user signs in with email "chithien.nguyen@germangains.com" and password "password123"
    Then the "Main Learning Page" page should be opened
    When the user clicks the "Pronunciation" button
    Then the "Pronunciation" page should be opened
    And the "Group" list should be visible
    And the "Sound" list should be visible
    When the user selects the "German Vowels" list item at index 1
    When the user selects the "German Vowels" list item at index "3"
    When the user selects the "German Vowels" list item at index 5
