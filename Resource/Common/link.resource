*** Settings ***
Documentation       Link interaction keywords.

Resource            common.resource


*** Keywords ***
Click Link '${NAME}'
    [Documentation]    Click a link locator by logical name.
    Click Category Element    link    ${NAME}

Link '${NAME}' Should Be Visible
    [Documentation]    Assert that a link locator is visible.
    Category Element Should Be Visible    link    ${NAME}

Link '${NAME}' Should Contain Text '${EXPECTED_TEXT}'
    [Documentation]    Assert that a link locator contains expected text.
    Category Element Text Should Contain    link    ${NAME}    ${EXPECTED_TEXT}
