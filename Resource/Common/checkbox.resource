*** Settings ***
Documentation       Checkbox interaction keywords.

Resource            common.resource


*** Keywords ***
Set Checkbox '${NAME}' To Checked State
    [Documentation]    Set checkbox locator to target checked state.
    ${SELECTOR}=    Get Locator In Category    checkbox    ${NAME}
    Click    css=${SELECTOR}

Checkbox '${NAME}' Should Be Visible
    [Documentation]    Assert that a checkbox locator is visible.
    Category Element Should Be Visible    checkbox    ${NAME}
