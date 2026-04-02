*** Settings ***
Documentation       Sign Up module keywords.

Resource            ../../Common/__lib.resource


*** Variables ***
${FIRST_NAME}       Chi Thien
${LAST_NAME}        Nguyen
${USERNAME}         nct0804
${EMAIL}            test@gmail.com
${PASSWORD}         testpass123
${CONFIRM_PASSWORD}    testpass123


*** Keywords ***
Sign Up Page Validation
    [Documentation]    Validate sign-up form fields and actions are visible.

    Validate Page Is Opened    Sign Up
    Textbox Should Be Visible    First Name
    Textbox Should Be Visible    Last Name
    Textbox Should Be Visible    Username
    Textbox Should Be Visible    Email Address
    Textbox Should Be Visible    Password
    Textbox Should Be Visible    Confirm Password
    Button Should Be Visible    Create Account
    Validate Category Elements If Present    button    Google    Facebook
    Validate Category Elements If Present    link    Sign In

Fill Registration Form
    [Documentation]    Fill the registration form fields with provided values.
    [Arguments]
    ...    ${FIRST_NAME}= Chi Thien
    ...    ${LAST_NAME}= Nguyen
    ...    ${USERNAME}= nct0804
    ...    ${EMAIL}= test@gmail.com
    ...    ${PASSWORD}= testpass123
    ...    ${CONFIRM_PASSWORD}= testpass123

    Fill Textbox With Value    First Name    ${FIRST_NAME}
    Fill Textbox With Value    Last Name    ${LAST_NAME}
    Fill Textbox With Value    Username    ${USERNAME}
    Fill Textbox With Value    Email Address    ${EMAIL}
    Fill Textbox With Value    Password    ${PASSWORD}
    Fill Textbox With Value    Confirm Password    ${CONFIRM_PASSWORD}

Submit Registration
    [Documentation]    Submit the registration form using provided values.
    [Arguments]
    ...    ${FIRST_NAME}= Chi Thien
    ...    ${LAST_NAME}= Nguyen
    ...    ${USERNAME}= nct0804
    ...    ${EMAIL}= test@gmail.com
    ...    ${PASSWORD}= testpass123
    ...    ${CONFIRM_PASSWORD}= testpass123
    Fill Registration Form    ${FIRST_NAME}    ${LAST_NAME}    ${USERNAME}    ${EMAIL}    ${PASSWORD}    ${CONFIRM_PASSWORD}
    Click Button    Create Account
    Wait For Load State    networkidle    timeout=15s

Create New Account
    [Documentation]    Fill and submit registration form with provided values.
    [Arguments]
    ...    ${FIRST_NAME}= Chi Thien
    ...    ${LAST_NAME}= Nguyen
    ...    ${USERNAME}= nct0804
    ...    ${EMAIL}= test@gmail.com
    ...    ${PASSWORD}= testpass123
    ...    ${CONFIRM_PASSWORD}= testpass123
    Submit Registration    ${FIRST_NAME}    ${LAST_NAME}    ${USERNAME}    ${EMAIL}    ${PASSWORD}    ${CONFIRM_PASSWORD}

Registration Error Should Be Visible
    [Documentation]    Assert registration error message box is visible.

    Messagebox Should Be Visible    Registration Error

Verify Registration Status
    [Documentation]    Verify registration notification title for expected status.
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
