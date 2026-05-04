Feature: Inbox Notifications Verification

  Scenario: User can open the inbox and verify unread notifications exist
    Given the user navigates to the "Sign In" page
    And the user logs in with default credentials
    When the user navigates to the "inbox" page
    And the user waits for "2" seconds
    Then the user eats a sandwich
    Then do the break dance