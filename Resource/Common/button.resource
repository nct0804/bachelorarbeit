*** Settings ***
Documentation       Locator map loader and resolver

Resource            ../MainLib.resource
Library             Collections
Library             OperatingSystem
Library             String


*** Keywords ***
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
