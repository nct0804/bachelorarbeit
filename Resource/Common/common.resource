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
    New Browser    ${BROWSER}    headless=${HEADLESS}    args=["-start-maximized"]
    New Context    viewport={'width': 1280, 'height': 720}
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
