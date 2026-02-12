*** Settings ***
Documentation       Common Resource File

Resource            ../MainLib.resource


*** Variables ***
${SERVER}       http://localhost:4242/


*** Keywords ***
Open Browser
    [Documentation]    Open the browser and the website
    [Tags]    basic
    [Arguments]    ${Browser}
    New Browser    ${Browser}    headless= False
    New Context
    New Page    ${SERVER}
    Maximize Browser Window

the user open the '${type}' browser
    [Documentation]    Open the browser and the website
    [Tags]    gherkin
    IF    '${type}' == 'chrome'
        Open Browser    chromium
    ELSE IF    '${type}' == 'firefox'
        Open Browser    firefox
    ELSE IF    '${type}' == 'edge'
        Open Browser    edge
    ELSE
        Fail    Unsupported browser type: ${type}
    END

Validate '${PAGE}' Is Opened
    [Documentation]    Verify that the expected page is opened
    [Tags]    basic
    ${current_url}=    Get Location
    IF    ${PAGE} == ${current_url}
        Log To Console    Current page ${PAGE} is opened successfully.
    ELSE
        Fail    Expected home page to be opened, but got ${current_url}
    END
    Should Contain    ${current_url}    ${PAGE}

the '${PAGE}' should be opened
    [Documentation]    Verify that the expected page is opened
    [Tags]    gherkin
    Validate '${PAGE}' Is Opened
