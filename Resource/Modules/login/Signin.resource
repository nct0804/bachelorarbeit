*** Settings ***
Documentation       Sign In module keywords.

Resource            ../../Common/__lib.resource


*** Variables ***
${TEST_EMAIL}       ${EMPTY}
${TEST_PASSWORD}    ${EMPTY}


*** Keywords ***
Go To Sign In Page
    [Documentation]    Navigate directly to the Sign In page.

    Navigate To Page 'Sign In'
    Validate Page 'Sign In' Is Opened

Sign In Page Should Be Ready
    [Documentation]    Validate sign-in form fields and actions are visible.

    Validate Page 'Sign In' Is Opened
    Textbox 'Email Address' Should Be Visible
    Textbox 'Password' Should Be Visible
    Button 'Sign In' Should Be Visible
    Validate Category Elements If Present    button    Sign Up
    Validate Category Elements If Present    checkbox    Remember Me

Fill Sign In Form
    [Documentation]    Fill sign-in form fields with provided credentials.
    [Arguments]    ${EMAIL}    ${PASSWORD}
    
    Go To Sign In Page
    Fill Textbox 'Email Address' with Value '${EMAIL}' 
    Fill Textbox 'Password' with Value '${PASSWORD}'

Submit Sign In Form
    [Documentation]    Submit the sign-in form.
    
    Go To Sign In Page
    Click Button 'Sign In'
    Wait For Load State    networkidle    timeout=15s

Sign In With Credentials
    [Documentation]    Fill and submit sign-in form with provided credentials.
    [Arguments]    ${EMAIL}    ${PASSWORD}
    
    Go To Sign In Page
    Fill Sign In Form    ${EMAIL}    ${PASSWORD}
    Submit Sign In Form
    ${ON_MAIN_PAGE}=    Run Keyword And Return Status    Validate Page 'Main Learning Page' Is Opened
    IF    not ${ON_MAIN_PAGE}
        Navigate To Page 'Main Learning Page'  
        Validate Page 'Main Learning Page' Is Opened
    END

Sign In With Suite Credentials
    [Documentation]    Sign in using suite-level credential variables.
    
    Go To Sign In Page
    Should Not Be Empty    ${TEST_EMAIL}
    Should Not Be Empty    ${TEST_PASSWORD}
    Sign In With Credentials    ${TEST_EMAIL}    ${TEST_PASSWORD}

Toggle Remember Me
    [Documentation]    Toggle the remember me checkbox.

     Set Checkbox 'Remember Me' To Checked State

Sign In Error Should Contain '${EXPECTED_TEXT}'
    [Documentation]    Assert sign-in notification area contains expected error text.

    Category Element Text Should Contain    notification    Error    ${EXPECTED_TEXT}
