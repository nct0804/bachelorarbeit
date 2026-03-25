*** Settings ***
Documentation       Tab interaction keywords.

Resource            common.resource


*** Keywords ***
Click Tab
    [Documentation]    Click a tab locator by logical name.
    [Arguments]    ${NAME}
    Click Category Element    tab    ${NAME}

Tab Should Be Visible
    [Documentation]    Assert that a tab locator is visible.
    [Arguments]    ${NAME}
    Category Element Should Be Visible    tab    ${NAME}
