    Scenario: Validation Dark Light mode
        Given the user triggers the "Sign Up" button
        Then the user verifies the "Sign Up" page is opened
        And the "Email Address" textbox should be visible
        And the "Password" textbox should be visible
        And the "Create Account" button should be visible
        And the user fills the "Email Address" textbox with "Roxana@gmail.com"
        And the user fills the "Password" textbox with "Roxana123"
        And the user fills the "Confirm Password" textbox with "Roxana123"
        And the user triggers the "Create Account" button
        Then the user verifies the "Sign In" page is opened
        And the user verfies the "Remember Me" checkbox is in "unchecked" state
        When the user clicks the "Remember Me" checkbox
        Then the user verifies the "Remember Me" checkbox is in "checked" state
        And the user fills the "Email Address" textbox with "Roxana@gmail.com"
        And the user fills the "Password" textbox with "Roxana123"
        And the user triggers the "Sign In" button
        Then the user verifies the "Main Page" page is opened
        When the user clicks the "Learn" button
        Then the user verifies the "Learn" page is opened
        When the user select the "Answer" option at index "1"
        And the user clicks the "Check" button
        Then the user verifies the "Check Result" messagebox is visible
        When the user fills the "Blank Input" textbox with "uten" value
        And the user clicks the "Check" button
        Then the user verifies the "Check Result" messagebox is visible
        When the user clicks the "Exit" button
        Then the "Exit Modal" messagebox should be visible
        When the user clicks the "Back to Home" button
        Then the "Main Page" page should be opened
        And the user sets the page theme to "Dark" mode
        Then the user verifies the page theme is "Dark" mode
        When the user clicks the "Menu Toggle" button
        And the "Logout" button should be visible
        When the user clicks the "Logout" button
        Then the "Logout Message" messagebox should be visible
        When the user clicks the "Log Out" button
        Then the "Sign In" page should be opened
        Then the user verifies the "Remember Me" checkbox is in "checked" state
        And the textbox "Email Address" should contain "Roxana@gmail.com"
        And the textbox "Password" should contain "Roxana123"
