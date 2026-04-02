  Scenario: Sign In Error Validation
    Given the user navigates to the "Sign In" page
    And the "Sign In" page should be opened
    When the user fills the "Email Address" textbox with "invalidemail@gmail.com" Value
    And the user fills the "Password" textbox with "password123" Value
    And the user clicks the "Sign In" button
    Then the "Error" notification should be visible
    And the "Error" notification should contain "Invalid credentials"
    And the user clears the "Email Address" textbox
    And the user clears the "Password" textbox
    When the user fills the "Email Address" textbox with "wrong@email.com" Value
    And the user fills the "Password" textbox with "wrongpassword" Value
    And the user clicks the "Sign In" button
    Then the "Error" notification should be visible