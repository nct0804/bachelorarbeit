*** Settings ***
Documentation       Sign In module keywords.

Resource            ../../Common/__lib.resource


*** Variables ***
${TEST_EMAIL}       chithien.nguyen@germangains.com
${TEST_PASSWORD}    password123


*** Keywords ***
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
    [Arguments]    ${EMAIL}    ${PASSWORD}
    Fill Sign In Form    ${EMAIL}    ${PASSWORD}
    Click Button    Sign In
    ${ON_MAIN_PAGE}=    Run Keyword And Return Status    Validate Page Is Opened    Main Learning Page
    IF    not ${ON_MAIN_PAGE}
        Navigate To Page    Main Learning Page
        Validate Page Is Opened    Main Learning Page
    END

Sign In With Suite Credentials
    [Documentation]    Sign in using suite-level credential variables.
    Should Not Be Empty    ${TEST_EMAIL}
    Should Not Be Empty    ${TEST_PASSWORD}
    Sign In With Credentials    ${TEST_EMAIL}    ${TEST_PASSWORD}

Sign In Error Should Contain '${EXPECTED_TEXT}'
    [Documentation]    Assert sign-in notification area contains expected error text.

    Category Element Text Should Contain    notification    Error    ${EXPECTED_TEXT}
