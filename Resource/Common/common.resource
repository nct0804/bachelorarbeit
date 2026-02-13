*** Settings ***
Documentation       Common Resource File

Resource            ../MainLib.resource


*** Variables ***
${SERVER}       localhost:4242
${BASE_URL}     http://${SERVER}/
${HEADLESS}     False


*** Keywords ***
Open Browser
    [Documentation]    Open a Browser instance and navigate to the base URL.
    [Tags]    basic
    [Arguments]    ${BROWSER}
    New Browser    ${BROWSER}    headless=${HEADLESS}
    New Context
    New Page    ${BASE_URL}

the user open the '${TYPE}' browser
    [Documentation]    Open a browser session based on the provided type.
    [Tags]    gherkin
    IF    '${TYPE}' == 'chrome'
        Open Browser    chromium
    ELSE IF    '${TYPE}' == 'firefox'
        Open Browser    firefox
    ELSE IF    '${TYPE}' == 'edge'
        Open Browser    chromium
    ELSE
        Fail    Unsupported browser type: ${TYPE}
    END

Validate '${PAGE}' Is Opened
    [Documentation]    Verify that the expected page is opened by a unique root element.
    [Tags]    basic
    Load Locators    ${PAGE}
    ${PAGE_LOCATOR}=    Get Locator    root
    Wait For Elements State    css=${PAGE_LOCATOR}    visible    timeout=10s

the '${PAGE}' page should be opened
    [Documentation]    Verify that the expected page is opened.
    [Tags]    gherkin
    Validate '${PAGE}' Is Opened

the user is on the '${PAGE}' page
    [Documentation]    Load locator map for a page name and validate its root element.
    [Tags]    gherkin
    Validate '${PAGE}' Is Opened

Click Button
    [Documentation]    Click a button using its locator from the current locator map.
    [Tags]    basic
    [Arguments]    ${NAME}
    ${CURRENT}=    Get Variable Value    ${LOC}    ${NONE}
    IF    $CURRENT == $NONE
        Fail    No locator map loaded. Call "the user is on the '<Page>' page" first.
    END
    ${SELECTOR}=    Get Locator    button.${NAME}
    Click    css=${SELECTOR}

the user clicks the '${Button}' button
    [Documentation]    Click a button using its locator from the current locator map.
    [Tags]    gherkin
    Click Button    ${Button}

Click Text
    [Documentation]    Click a button using its locator from the current locator map.
    [Tags]    basic
    [Arguments]    ${NAME}
    ${CURRENT}=    Get Variable Value    ${LOC}    ${NONE}
    IF    $CURRENT == $NONE
        Fail    No locator map loaded. Call "the user is on the '<Page>' page" first.
    END
    ${SELECTOR}=    Get Locator    text.${NAME}
    Click    css=${SELECTOR}

the user clicks the '${Text}' text
    [Documentation]    Click a text element using its locator from the current locator map.
    [Tags]    gherkin
    Click Text    ${Text}
