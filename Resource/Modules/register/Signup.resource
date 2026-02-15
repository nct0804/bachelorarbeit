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
    ${STATUS_LOWER}=    Convert To Lowercase    ${Status}
    IF    '${STATUS_LOWER}' == 'successful'
        ${EXPECTED_TITLE}=    Set Variable    Registration Successful!
        ${TITLE_TEXT}=    Browser.Get Text    css=${NOTIF_TITLE}
        Should Be Equal    ${TITLE_TEXT}    ${EXPECTED_TITLE}
    ELSE IF    '${STATUS_LOWER}' == 'failed'
        ${EXPECTED_TITLE}=    Set Variable    Registration Failed
        ${TITLE_TEXT}=    Browser.Get Text    css=${NOTIF_TITLE}
        Should Be Equal    ${TITLE_TEXT}    ${EXPECTED_TITLE}
    ELSE
        Fail    Unsupported registration status: ${Status}
    END

the user verifies the registration is '${Status}'
    [Documentation]    Verify the registration result based on the expected status.
    [Tags]    gherkin
    Verify The Registration Is '${Status}'
