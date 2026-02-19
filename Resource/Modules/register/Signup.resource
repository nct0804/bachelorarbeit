*** Settings ***
Documentation       Sign Up module keywords.

Resource            ../../Common/__lib.resource


*** Variables ***
${TEST_FIRST_NAME}      ${EMPTY}
${TEST_LAST_NAME}       ${EMPTY}
${TEST_USERNAME}        ${EMPTY}
${TEST_EMAIL}           ${EMPTY}
${TEST_PASSWORD}        ${EMPTY}


*** Keywords ***
Go To Sign Up Page
    [Documentation]    Navigate directly to the Sign Up page.
    [Tags]    Basic
    Navigate To Page    Sign Up

Fill Registration Form
    [Documentation]    Fill the registration form fields with provided values.
    [Tags]    Basic
    [Arguments]    ${FIRST_NAME}    ${LAST_NAME}    ${USERNAME}    ${EMAIL}    ${PASSWORD}
    Fill Textbox    First Name    ${FIRST_NAME}
    Fill Textbox    Last Name    ${LAST_NAME}
    Fill Textbox    Username    ${USERNAME}
    Fill Textbox    Email Address    ${EMAIL}
    Fill Textbox    Password    ${PASSWORD}

Submit Registration Form
    [Documentation]    Submit the registration form using create account action.
    [Tags]    Basic
    Click Button    Create Account
    Wait For Load State    networkidle    timeout=15s

Sign Up With Information
    [Documentation]    Fill and submit registration form with provided values.
    [Tags]    Basic
    [Arguments]    ${FIRST_NAME}    ${LAST_NAME}    ${USERNAME}    ${EMAIL}    ${PASSWORD}
    Fill Registration Form    ${FIRST_NAME}    ${LAST_NAME}    ${USERNAME}    ${EMAIL}    ${PASSWORD}
    Submit Registration Form

Sign Up With Suite Information
    [Documentation]    Fill and submit sign-up form using suite-level variables.
    [Tags]    Basic
    Should Not Be Empty    ${TEST_FIRST_NAME}
    Should Not Be Empty    ${TEST_LAST_NAME}
    Should Not Be Empty    ${TEST_USERNAME}
    Should Not Be Empty    ${TEST_EMAIL}
    Should Not Be Empty    ${TEST_PASSWORD}
    Sign Up With Information
    ...    ${TEST_FIRST_NAME}
    ...    ${TEST_LAST_NAME}
    ...    ${TEST_USERNAME}
    ...    ${TEST_EMAIL}
    ...    ${TEST_PASSWORD}

Verify Registration Status
    [Documentation]    Verify registration notification title for expected status.
    [Tags]    Basic
    [Arguments]    ${STATUS}
    ${STATUS_KEY}=    Normalize Page Name    ${STATUS}
    Notification Should Be Visible    Container
    IF    '${STATUS_KEY}' == 'successful' or '${STATUS_KEY}' == 'success'
        Notification Should Contain Text    Title    Registration Successful!
        RETURN
    END
    IF    '${STATUS_KEY}' == 'failed' or '${STATUS_KEY}' == 'failure' or '${STATUS_KEY}' == 'error'
        Notification Should Contain Text    Title    Registration Failed
        RETURN
    END
    Fail    Unsupported registration status: ${STATUS}

the user signs up with '${FirstName}' '${LastName}' '${Username}' '${Email}' '${Password}'
    [Documentation]    Sign up using explicit registration values in positional order.
    [Tags]    Gherkin
    Sign Up With Information    ${FirstName}    ${LastName}    ${Username}    ${Email}    ${Password}

the user signs up with the information
    [Documentation]    Sign up using suite-level registration values.
    [Tags]    Gherkin
    Sign Up With Suite Information

the user verifies the registration is '${Status}'
    [Documentation]    Verify registration status from notification title.
    [Tags]    Gherkin
    Verify Registration Status    ${Status}
