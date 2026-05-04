  Scenario: Form Interaction and Validation
    Given the user navigates to the "Sign In" page
    Then the "Sign In" page should be opened
    When the user fills the "Email Address" textbox with "test@email.com" Value
    And the user clears the "Email Address" textbox
    Then the "Email Address" textbox should be empty
    When the user fills the "Email Address" textbox with "chithien@test.com" Value
    Then the "Email Address" textbox should contain "chithien@test.com"
    When the user navigates to the "Sign Up" page
    And the "Sign Up" page should be opened
    When the user fills the "First Name" textbox with "Chi Thien" Value
    And the user fills the "Last Name" textbox with "Nguyen" Value
    And the user fills the "Username" textbox with "chithien_test" Value
    And the user fills the "Email Address" textbox with "chithien@example.com" Value
    And the user fills the "Password" textbox with "securepassword123" Value
    And the user fills the "Confirm Password" textbox with "securepassword123" Value
    Then the "First Name" textbox should contain "Chi Thien"
    And the "Last Name" textbox should contain "Nguyen"
    And the "Username" textbox should contain "chithien_test"
    When the user navigates to the "Sign In" page
    Then the "Sign In" page should be opened
    And the "Password" textbox should be visible
    When the user fills the "Password" textbox with "hiddenpassword" Value
    Then the "Password" textbox should contain "hiddenpassword" value
    And the "Remember Me" checkbox should be visible
    When the user verifies if the checkbox "Remember Me" status is "unchecked"
    Then the "Remember Me" checkbox state should be "unchecked"
    When the user clicks the "Remember Me" checkbox
    Then the "Remember Me" checkbox state should be "checked"