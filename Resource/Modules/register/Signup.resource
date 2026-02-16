*** Settings ***
Documentation       Library resource for Sign up Page

Resource            ../../MainLib.resource


*** Keywords ***
Verify The Registration Is '${Status}'
    [Documentation]    Verify that the registration process resulted in the expected "${Status}".
    [Tags]    basic
    ${CURRENT}=    Get Variable Value    ${LOC}    ${NONE}
    IF    $CURRENT == $NONE
        Fail    No locator map loaded. Call "the user is on the '<Page>' page" first.
    END
    Wait For Load State    networkidle    timeout=30s
    ${NOTIF_TITLE}=    Get Locator    notification.Title
    ${TITLE_TEXT}=    Browser.Get Text    css=${NOTIF_TITLE}
    ${STATUS_LOWER}=    Convert To Lowercase    ${Status}

    IF    '${STATUS_LOWER}' == 'successful'
        ${EXPECTED_TITLE}=    Set Variable    Registration Successful!
        IF    '${TITLE_TEXT}' == '${EXPECTED_TITLE}'
            Log    Registration succeeded as expected.
        ELSE
            ${NOTIF_MESSAGE}=    Get Locator    messagebox.Registration Error
            ${NOTIF_MESSAGE_TEXT}=    Browser.Get Text    css=${NOTIF_MESSAGE}
            Fail    ${NOTIF_MESSAGE_TEXT}
        END
    ELSE IF    '${STATUS_LOWER}' == 'failed'
        ${EXPECTED_TITLE}=    Set Variable    Registration Failed
        Should Be Equal    ${TITLE_TEXT}    ${EXPECTED_TITLE}
    ELSE
        Fail    Unsupported registration status: ${Status}
    END

the user verifies the registration is '${Status}'
    [Documentation]    Verify the registration result based on the expected status.
    [Tags]    gherkin
    Verify The Registration Is '${Status}'

the user signs up with the information
    [Documentation]    Fill multiple textboxes based on a data table of field names and values.
    [Tags]    gherkin
    the user fills the 'First Name' textbox with 'Chi Thien'
    the user fills the 'Last Name' textbox with 'Nguyen'
    the user fills the 'Username' textbox with 'nct0804'
    the user fills the 'Email Address' textbox with 'chi.thien.nguyen@example.com'
    the user fills the 'Password' textbox with 'password123'
    the user clicks the 'Create Account' button
