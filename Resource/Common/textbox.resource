*** Settings ***
Documentation       Textbox interaction keywords.

Resource            common.resource


*** Keywords ***
Fill Textbox With Value
    [Documentation]    Fill a textbox locator with provided value.
    [Arguments]    ${TEXTBOX}    ${VALUE}
    Fill Category Element    textbox    ${TEXTBOX}    ${VALUE}

Fill Textbox
    [Documentation]    Fill a textbox locator with provided value.
    [Arguments]    ${TEXTBOX}    ${VALUE}
    Fill Category Element    textbox    ${TEXTBOX}    ${VALUE}

Clear Textbox
    [Documentation]    Clear a textbox locator value.
    [Arguments]    ${TEXTBOX}
    Fill Category Element    textbox    ${TEXTBOX}    ${EMPTY}

Textbox Should Be Visible
    [Documentation]    validate that a textbox locator is visible.
    [Arguments]    ${TEXTBOX}
    Category Element Should Be Visible    textbox    ${TEXTBOX}

Textbox Contain Value
    [Documentation]    validate textbox value contains expected text.
    [Arguments]    ${TEXTBOX}    ${EXPECTED_VALUE}

    ${SELECTOR}=    Get Locator In Category    textbox    ${TEXTBOX}
    ${VALUE}=    Get Property    css=${SELECTOR}    value
    Should Contain    ${VALUE}    ${EXPECTED_VALUE}

Textbox Should Be Empty
    [Documentation]    validate that a textbox locator is empty.
    [Arguments]    ${TEXTBOX}

    ${SELECTOR}=    Get Locator In Category    textbox    ${TEXTBOX}
    ${VALUE}=    Get Property    css=${SELECTOR}    value
    Should Be Empty    ${VALUE}

Set Value In The Textbox
    [Documentation]    Gherkin wrapper for filling a textbox with a value.
    [Arguments]    ${VALUE}    ${TEXTBOX}
    Fill Textbox With Value    ${TEXTBOX}    ${VALUE}
