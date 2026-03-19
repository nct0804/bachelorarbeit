*** Settings ***
Documentation       Textbox interaction keywords.

Resource            common.resource


*** Keywords ***
Fill Textbox '${NAME}' With Value '${VALUE}'
    [Documentation]    Fill a textbox locator with provided value.

    Fill Category Element    textbox    ${NAME}    ${VALUE}

Clear Textbox '${NAME}'
    [Documentation]    Clear a textbox locator value.

    Fill Category Element    textbox    ${NAME}    ${EMPTY}

Textbox '${NAME}' Should Be Visible
    [Documentation]    validate that a textbox locator is visible.

    Category Element Should Be Visible    textbox    ${NAME}

Textbox '${NAME}' Value Should Contain '${EXPECTED_VALUE}'
    [Documentation]    validate textbox value contains expected text.

    ${SELECTOR}=    Get Locator In Category    textbox    ${NAME}
    ${VALUE}=    Get Property    css=${SELECTOR}    value
    Should Contain    ${VALUE}    ${EXPECTED_VALUE}

Textbox '${NAME}' Should Be Empty
    [Documentation]    validate that a textbox locator is empty.

    ${SELECTOR}=    Get Locator In Category    textbox    ${NAME}
    ${VALUE}=    Get Property    css=${SELECTOR}    value
    Should Be Empty    ${VALUE}
