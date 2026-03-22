*** Settings ***
Documentation       Sign Up module keywords.

Resource            ../../Common/__lib.resource


*** Variables ***
${FIRST_NAME}       Chi Thien
${LAST_NAME}        Nguyen
${USERNAME}         chithien.nguyen1
${EMAIL}            chithien.nguyen1@germangains.com
${PASSWORD}         password123


*** Keywords ***
Sign Up Page Validation
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
