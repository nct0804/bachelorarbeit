*** Settings ***
Library             Browser
Resource            ../Resource/MainLib.resource

Test Teardown       Browser.Close Browser


*** Test Cases ***
Scenario Ouline TC-10 test
    Given the user open the 'firefox' browser
    And the 'Homepage' page should be opened
    When the user clicks the 'Sign In' button
    Then the 'Sign In' page should be opened
    When the user clicks the 'Sign Up' text
    Then the 'Sign Up' page should be opened
    # When the user open the browser
    # the user go to Sign In Page

    # # Wait for the button to be visible and clickable
    # Wait For Elements State    id="email"    visible    timeout=10s

    # Click the button
    # Input Text    id="email"    darealthien@gmail.com

    # # Wait for page to load after click
    # Sleep    2s

    # # Take a screenshot to verify
    # # Take Screenshot

    # # Close browser
    # # Close Browse
