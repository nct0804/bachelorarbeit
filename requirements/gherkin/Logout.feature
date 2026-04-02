  Scenario: Logout Functionality Validation
    Given the user navigates to the "Sign Up" page
    Then the "Sign Up" page should be opened
    And the "First Name" textbox should be visible
    And the "Last Name" textbox should be visible
    And the "Username" textbox should be visible
    And the "Email Address" textbox should be visible
    And the "Password" textbox should be visible
    And the "Confirm Password" textbox should be visible
    And the user clicks the "Sign In" text
    Then the "Sign In" page should be opened
    When the user signs in with email "chithien.nguyen@germangains.com" and password "password123"
    Then the "Main Learning Page" page should be opened
    And the user clicks the "Menu Toggle" button
    And the user clicks the "About" button
    Then the "About Us" page should be opened
    And the user clicks the "Menu Toggle" button
    And the user clicks the "Profile" button
    Then the "Profile" page should be opened
    And the user clicks the "Menu Toggle" button
    And the user clicks the "Logout" button
    Then the "Logout Message" messagebox should be visible
    And the user clicks the "Logout Confirm" button
    Then the "Sign In" page should be opened
