*** Settings ***
Documentation       Text interaction keywords.

Resource            common.resource


*** Keywords ***
Click Text
    [Documentation]    Click a text locator by logical name.
    [Arguments]    ${NAME}

    Click Category Element    text    ${NAME}

Text Should Be Visible
    [Documentation]    Assert that a text locator is visible.
    [Arguments]    ${NAME}

    Category Element Should Be Visible    text    ${NAME}
