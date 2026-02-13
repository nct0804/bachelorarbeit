*** Settings ***
Documentation       Library resource for Sign In Page

Resource            ../../MainLib.resource

*** Variables ***

${BASE_URL}    http://localhost:4242
*** Keywords ***
Go To Sign In Page
    [Documentation]    Navigate to the Sign In page and verify it loads correctly.
    [Tags]    basic
    Browser.Go To    ${BASE_URL}/login
    Wait Until Element Is Visible    Log in page

the user go to Sign In Page
    [Documentation]    Navigate to the Sign In page.
    [Tags]    gherkin
    Go To Sign In Page