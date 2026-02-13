*** Settings ***
Documentation       Common Resource File

Resource            ../MainLib.resource


*** Variables ***
${SERVER}       localhost:4242
${BASE URL}     http://${SERVER}/


*** Keywords ***
Open Browser
    [Documentation]    Open the browser and the website
    [Tags]    basic
    [Arguments]    ${Browser}
    New Browser    ${Browser}    headless=False
    New Context
    New Page    ${BASE URL}

The User Open The '${type}' Browser
    [Documentation]    Open the browser and the website
    [Tags]    gherkin
    IF    '${type}' == 'chrome'
        Open Browser    chromium
    ELSE IF    '${type}' == 'firefox'
        Open Browser    firefox
    ELSE IF    '${type}' == 'edge'
        Open Browser    chromium
    ELSE
        Fail    Unsupported browser type: ${type}
    END

Validate '${PAGE}' Is Opened
    [Documentation]    Verify that the expected page is opened by a page-unique locator
    [Tags]    basic
    Load Locators    ${PAGE}
    ${page_locator}=    Get Locator    page
    Wait For Elements State    css=${page_locator}    visible    timeout=10s

the '${PAGE}' page should be opened
    [Documentation]    Verify that the expected page is opened
    [Tags]    gherkin
    Validate '${PAGE}' Is Opened

the user is on the '${Page}' page
    [Documentation]    Load page locator map and verify a page-unique element
    [Tags]    gherkin
    [Arguments]    ${Page}
    Load Locators    ${Page}
    Set Suite Variable    ${CURRENT_PAGE}    ${Page}
    ${page_locator}=    Get Locator    page
    Wait For Elements State    css=${page_locator}    visible    timeout=10s

Click Button
    [Documentation]    Click a button using its locator from the current locator map
    [Tags]    basic
    [Arguments]    ${name}
    ${current}=    Get Variable Value    ${LOC}    ${NONE}
    IF    ${current} == ${NONE}
        Fail    No locator map loaded. Call "The User Is On The '<Page>' Page" first.
    END
    ${selector}=    Get Locator    button.${name}
    Click    css=${selector}

the user triggers the '${Button}' button
    [Documentation]    Click a button using its locator from the locator map
    [Tags]    gherkin
    Click Button    ${Button}
