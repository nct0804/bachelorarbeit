*** Settings ***
Documentation       Text interaction keywords.

Resource            common.resource


*** Keywords ***
Click Text '${NAME}'
    [Documentation]    Click a text locator by logical name.
    Click Category Element    text    ${NAME}

Text '${NAME}' Should Be Visible
    [Documentation]    Assert that a text locator is visible.
    Category Element Should Be Visible    text    ${NAME}
