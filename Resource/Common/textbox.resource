*** Settings ***
Documentation       Textbox interaction keywords.

Resource            common.resource


*** Keywords ***
Fill Textbox
    [Documentation]    Fill a textbox locator with provided value.
    [Tags]    Basic
    [Arguments]    ${NAME}    ${VALUE}
    Fill Category Element    textbox    ${NAME}    ${VALUE}

Clear Textbox
    [Documentation]    Clear a textbox locator value.
    [Tags]    Basic
    [Arguments]    ${NAME}
    Fill Category Element    textbox    ${NAME}    ${EMPTY}

Textbox Should Be Visible
    [Documentation]    validate that a textbox locator is visible.
    [Tags]    Basic
    [Arguments]    ${NAME}
    Category Element Should Be Visible    textbox    ${NAME}

Textbox Value Should Contain
    [Documentation]    validate textbox value contains expected text.
    [Tags]    Basic
    [Arguments]    ${NAME}    ${EXPECTED_VALUE}
    ${SELECTOR}=    Get Locator In Category    textbox    ${NAME}
    ${VALUE}=    Get Property    css=${SELECTOR}    value
    Should Contain    ${VALUE}    ${EXPECTED_VALUE}