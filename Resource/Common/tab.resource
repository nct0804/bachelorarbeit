*** Settings ***
Documentation       Tab interaction keywords.

Resource            common.resource


*** Keywords ***
Click Tab '${NAME}'
    [Documentation]    Click a tab locator by logical name.

    Click Category Element    tab    ${NAME}

Tab '${NAME}' Should Be Visible
    [Documentation]    Assert that a tab locator is visible.

    Category Element Should Be Visible    tab    ${NAME}
