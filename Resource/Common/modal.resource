*** Settings ***
Documentation       Modal interaction keywords.

Resource            common.resource


*** Keywords ***
Modal Should Be Visible
    [Documentation]    Assert that a modal locator is visible.
    [Arguments]    ${NAME}

    Category Element Should Be Visible    modal    ${NAME}

Modal Should Not Be Visible
    [Documentation]    Assert that a modal locator is not visible.
    [Arguments]    ${NAME}

    Category Element Should Not Be Visible    modal    ${NAME}
