*** Settings ***
Documentation       Sign In module keywords.

Resource            ../../Common/__lib.resource


*** Variables ***
${TEST_EMAIL}       ${EMPTY}
${TEST_PASSWORD}    ${EMPTY}


*** Keywords ***
Go To Sign In Page
    [Documentation]    Navigate directly to the Sign In page.
    [Tags]    Basic
    Navigate To Page    Sign In

Sign In With Credentials
    [Documentation]    Fill and submit sign-in form with provided credentials.
    [Tags]    Basic
    [Arguments]    ${EMAIL}    ${PASSWORD}
    Fill Textbox    Email Address    ${EMAIL}
    Fill Textbox    Password    ${PASSWORD}
    Click Button    Sign In
    Wait For Load State    networkidle    timeout=15s
    ${ON_MAIN_PAGE}=    Run Keyword And Return Status    Validate Page Is Opened    Main Learning Page
    IF    not ${ON_MAIN_PAGE}
        Navigate To Page    Main Learning Page
        Validate Page Is Opened    Main Learning Page
    END

Sign In With Suite Credentials
    [Documentation]    Sign in using suite-level credential variables.
    [Tags]    Basic
    Should Not Be Empty    ${TEST_EMAIL}
    Should Not Be Empty    ${TEST_PASSWORD}
    Sign In With Credentials    ${TEST_EMAIL}    ${TEST_PASSWORD}

Sign In Error Should Contain
    [Documentation]    Assert sign-in notification area contains expected error text.
    [Tags]    Basic
    [Arguments]    ${EXPECTED_TEXT}
    Category Element Text Should Contain    notification    Error    ${EXPECTED_TEXT}

the user go to sign in page
    [Documentation]    Navigate to the Sign In page.
    [Tags]    Gherkin
    Go To Sign In Page

the user signs in with email '${Email}' and password '${Password}'
    [Documentation]    Sign in using explicit credentials.
    [Tags]    Gherkin
    Sign In With Credentials    ${Email}    ${Password}

the user signs in with their credentials
    [Documentation]    Sign in using suite-level credential variables.
    [Tags]    Gherkin
    Sign In With Suite Credentials

the sign in error should contain '${Text}'
    [Documentation]    Verify sign-in error text contains expected content.
    [Tags]    Gherkin
    Sign In Error Should Contain    ${Text}
