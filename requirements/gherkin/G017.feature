    Scenario: Sign Up Error Validation
        Given the user navigates to the "Sign Up" page
        Then the "Sign Up" page should be opened
        And the "First Name" textbox should be visible
        And the "Last Name" textbox should be visible
        And the "Username" textbox should be visible
        And the "Email Address" textbox should be visible
        And the "Password" textbox should be visible
        And the "Create Account" button should be visible
        When the user fills the "First Name" textbox with "Test" Value
        And the user fills the "Last Name" textbox with "User" Value
        And the user fills the "Username" textbox with "testuser" Value
        And the user fills the "Email Address" textbox with "invalidemail@gmail.com" Value
        And the user fills the "Password" textbox with "password" Value
        And the user fills the "Confirm Password" textbox with "password" Value
        And the user clicks the "Create Account" button
        And the "Title" notification should contain "Registration Failed"
