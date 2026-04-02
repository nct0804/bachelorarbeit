*** Settings ***
Documentation       Sign In module keywords.

Resource            ../../Common/__lib.resource


*** Variables ***
${EMAIL}        chithien.nguyen@germangains.com
${PASSWORD}     password123


*** Keywords ***
Navigate To Sign In Page
    [Documentation]    Navigate to the Sign In page from the Welcome Page.

    Go To Page    Welcome Page
    Click Button    Sign In
    Validate Page Is Opened    Sign In

Sign In Page Validation
    [Documentation]    Validate sign-in form fields and actions are visible.

    Validate Page Is Opened    Sign In
    Textbox Should Be Visible    Email Address
    Textbox Should Be Visible    Password
    Button Should Be Visible    Sign In
    Validate Category Elements If Present    button    Sign Up
    Validate Category Elements If Present    checkbox    Remember Me

Fill Sign In Form
    [Documentation]    Fill sign-in form fields with provided credentials.
    [Arguments]    ${EMAIL}    ${PASSWORD}
    Fill Textbox With Value    Email Address    ${EMAIL}
    Fill Textbox With Value    Password    ${PASSWORD}
    Click Button    Sign In

Sign In With Credentials
    [Documentation]    Fill and submit sign-in form with provided credentials.
    Fill Textbox With Value    Email Address    ${EMAIL}
    Fill Textbox With Value    Password    ${PASSWORD}
    Click Button    Sign In
    ${ON_MAIN_PAGE}=    Run Keyword And Return Status    Validate Page Is Opened    Main Learning Page
    IF    not ${ON_MAIN_PAGE}    Validate Page Is Opened    Main Learning Page

Sign In Error Should Contain Text
    [Documentation]    Assert sign-in notification area contains expected error text.
    [Arguments]    ${EXPECTED_TEXT}
    Category Element Text Should Contain    notification    Error    ${EXPECTED_TEXT}

Error Message Should Be Visible
    [Documentation]    Assert that the error message box is visible.
    Messagebox Should Be Visible    Error
