*** Settings ***
Documentation       Button interaction keywords.

Resource            common.resource


*** Keywords ***
Click Button '${NAME}'
    [Documentation]    Click a button locator by logical name.
    Click Category Element    button    ${NAME}

Click Button '${NAME}' At Index
    [Documentation]    Click a button locator using an index for repeated selectors.
    [Arguments]    ${INDEX}=0
    Click Category Element At Index    button    ${NAME}    ${INDEX}

Button '${NAME}' Should Be Visible
    [Documentation]    Assert that a button locator is visible.
    Category Element Should Be Visible    button    ${NAME}
