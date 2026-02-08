*** Settings ***
Library     Browser
Resource    ../Resource/MainLib.resource


*** Test Cases ***
Scenario Ouline TC-10 test
    Given the user open the browser
    When the user open the browser
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
