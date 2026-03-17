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

    Navigate To Page 'Sign Up'

Sign Up Page Should Be Ready
    [Documentation]    Validate sign-up form fields and actions are visible.

    Validate Page 'Sign Up' Is Opened
    Textbox 'First Name' Should Be Visible
    Textbox 'Last Name' Should Be Visible
    Textbox 'Username' Should Be Visible
    Textbox 'Email Address' Should Be Visible
    Textbox 'Password' Should Be Visible
    Button 'Create Account' Should Be Visible
    Validate Category Elements If Present    button    Google    Facebook
    Validate Category Elements If Present    link    Sign In

Fill Registration Form
    [Documentation]    Fill the registration form fields with provided values.
    [Arguments]    ${FIRST_NAME}    ${LAST_NAME}    ${USERNAME}    ${EMAIL}    ${PASSWORD}

    Fill Textbox 'First Name' With Value '${FIRST_NAME}'
    Fill Textbox 'Last Name' With Value '${LAST_NAME}'
    Fill Textbox 'Username' With Value '${USERNAME}'
    Fill Textbox 'Email Address' With Value '${EMAIL}'
    Fill Textbox 'Password' With Value '${PASSWORD}'

Submit Registration Form
    [Documentation]    Submit the registration form using create account action.

    Click Button 'Create Account'
    Wait For Load State    networkidle    timeout=15s

Sign Up With Information
    [Documentation]    Fill and submit registration form with provided values.
    [Arguments]    ${FIRST_NAME}    ${LAST_NAME}    ${USERNAME}    ${EMAIL}    ${PASSWORD}

    Fill Registration Form    ${FIRST_NAME}    ${LAST_NAME}    ${USERNAME}    ${EMAIL}    ${PASSWORD}
    Submit Registration Form

Sign Up With Suite Information
    [Documentation]    Fill and submit sign-up form using suite-level variables.

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

Registration Error Should Be Visible
    [Documentation]    Assert registration error message box is visible.

    Messagebox 'Registration Error' Should Be Visible

Verify Registration Status '${STATUS}'
    [Documentation]    Verify registration notification title for expected status.

    ${STATUS_KEY}=    Normalize Page '${STATUS}' Name
    Notification 'Container' Should Be Visible
    IF    '${STATUS_KEY}' == 'successful' or '${STATUS_KEY}' == 'success'
        Notification 'Title' Should Contain Text 'Registration Successful!'
        RETURN
    END
    IF    '${STATUS_KEY}' == 'failed' or '${STATUS_KEY}' == 'failure' or '${STATUS_KEY}' == 'error'
        Notification 'Title' Should Contain Text 'Registration Failed'
        RETURN
    END
    Fail    Unsupported registration status: ${STATUS}
