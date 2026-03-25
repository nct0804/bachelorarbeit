*** Settings ***
Documentation       Button interaction keywords.

Resource            common.resource


*** Keywords ***
Click Button
    [Documentation]    Click a button locator by logical name.
    [Arguments]    ${NAME}
    Click Category Element    button    ${NAME}

Click Button At Index
    [Documentation]    Click a button locator using an index for repeated selectors.
    [Arguments]    ${NAME}    ${INDEX}
    Click Category Element At Index    button    ${NAME}    ${INDEX}

Button Should Be Visible
    [Documentation]    Assert that a button locator is visible.
    [Arguments]    ${NAME}
    Category Element Should Be Visible    button    ${NAME}
