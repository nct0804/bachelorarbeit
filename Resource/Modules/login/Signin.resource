*** Settings ***
Documentation       Sign In module keywords.

Resource            ../../Common/__lib.resource


*** Variables ***
${TEST_EMAIL}       ${EMPTY}
${TEST_PASSWORD}    ${EMPTY}


*** Keywords ***
Go To Sign In Page
    [Documentation]    Navigate directly to the Sign In page.

    Navigate To Page    Sign In

Sign In Page Should Be Ready
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

    Fill Textbox    Email Address    ${EMAIL}
    Fill Textbox    Password    ${PASSWORD}

Submit Sign In Form
    [Documentation]    Submit the sign-in form.

    Click Button    Sign In
    Wait For Load State    networkidle    timeout=15s

Sign In With Credentials
    [Documentation]    Fill and submit sign-in form with provided credentials.
    [Arguments]    ${EMAIL}    ${PASSWORD}

    Fill Sign In Form    ${EMAIL}    ${PASSWORD}
    Submit Sign In Form
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

Open Sign Up From Sign In
    [Documentation]    Navigate to the sign-up page from sign-in.

    Click Button    Sign Up
    Validate Page Is Opened    Sign Up

Toggle Remember Me
    [Documentation]    Toggle the remember me checkbox.

    Set Checkbox    Remember Me

Sign In Error Should Contain
    [Documentation]    Assert sign-in notification area contains expected error text.
    [Arguments]    ${EXPECTED_TEXT}

    Category Element Text Should Contain    notification    Error    ${EXPECTED_TEXT}
