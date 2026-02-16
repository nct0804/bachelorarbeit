*** Settings ***
Documentation       Locator map loader and resolver

Resource            ../MainLib.resource
Library             Collections
Library             OperatingSystem
Library             String


*** Keywords ***
Fill Textbox
    [Documentation]    Fill a textbox using its locator from the current locator map.
    [Tags]    basic
    [Arguments]    ${NAME}    ${VALUE}
    ${CURRENT}=    Get Variable Value    ${LOC}    ${NONE}
    IF    $CURRENT == $NONE
        Fail    No locator map loaded. Call "the user is on the '<Page>' page" first.
    END
    ${LOCATOR}=    Get Locator    textbox.${NAME}
    IF    '${LOCATOR}' == '${NONE}'
        Fail    No locator found for textbox "${NAME}" in the current locator map.
    END
    Fill Text    css=${LOCATOR}    ${VALUE}

the user fills the '${Textbox}' textbox with '${Value}'
    [Documentation]    Fill a textbox using its locator from the current locator map.
    [Tags]    gherkin
    Fill Textbox    ${Textbox}    ${Value}

