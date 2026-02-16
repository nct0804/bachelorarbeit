*** Settings ***
Documentation       Library resource for Sign In Page

Resource            ../../MainLib.resource


*** Variables ***
${BASE_URL}     http://localhost:4242


*** Keywords ***
Go To Sign In Page
    [Documentation]    Navigate to the Sign In page and verify it loads correctly.
    [Tags]    basic
    Browser.Go To    ${BASE_URL}/login
    Wait Until Element Is Visible    Log in page

the user go to Sign In Page
    [Documentation]    Navigate to the Sign In page.
    [Tags]    gherkin
    Go To Sign In Page

the user signs in with their credentials
    [Documentation]    Fill in the sign-in form with valid credentials. If "Invalid credentials" error occurs, register first then retry.
    [Tags]    gherkin
    TRY
        the user fills the 'Email Address' textbox with 'chi.thien.nguyen@example.com'
        the user fills the 'Password' textbox with 'password123'
        the user clicks the 'Sign In' button
        Wait For Load State    networkidle    timeout=5s
        ${ERROR_EXISTS}=    Run Keyword And Return Status
        ...    Wait For Elements State
        ...    text="Invalid credentials"
        ...    visible
        ...    timeout=2s

        IF    ${ERROR_EXISTS}
            Log    Invalid credentials detected. User needs to register first.
            Browser.Go To    ${BASE_URL}/register
            Wait For Load State    networkidle    timeout=5s
            the user is on the 'register' page
            the user signs up with the information
            Wait For Load State    networkidle    timeout=5s
            the user verifies the registration is 'successful'
            Sleep    3s
            the user is on the 'Login' page
            the user fills the 'Email Address' textbox with 'chi.thien.nguyen@example.com'
            the user fills the 'Password' textbox with 'password123'
            the user clicks the 'Sign In' button
            # Wait For Load State    networkidle    timeout=10s
        END
    EXCEPT    AS    ${error}
        ${IS_INVALID_CREDS}=    Run Keyword And Return Status    Should Contain    ${error}    Invalid credentials
        IF    not ${IS_INVALID_CREDS}
            Fail    Sign in failed with unexpected error: ${error}
        END
    END
