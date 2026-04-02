*** Settings ***
Documentation       Link interaction keywords.

Resource            common.resource


*** Keywords ***
Click Link
    [Documentation]    Click a link locator by logical name.
    [Arguments]    ${NAME}
    Click Category Element    link    ${NAME}

Link Should Be Visible
    [Documentation]    Assert that a link locator is visible.
    [Arguments]    ${NAME}
    Category Element Should Be Visible    link    ${NAME}

Link Should Contain Text
    [Documentation]    Assert that a link locator contains expected text.
    [Arguments]    ${NAME}    ${EXPECTED_TEXT}
    Category Element Text Should Contain    link    ${NAME}    ${EXPECTED_TEXT}
