    Scenario: Validation Dark Light mode
        Given the user navigates to the "Sign In" page
        When the user logs in with their Credentials
        Then the "Main Page" page should be opened
        When the user sets the page theme to "Dark" mode
        Then the user verifies the page theme is "Dark" mode
        When the user sets the page theme to "Light" mode
        Then the page theme should be "Light" mode