*** Settings ***
Documentation       Checkbox interaction keywords.

Resource            common.resource


*** Keywords ***
Set Checkbox
    [Documentation]    Set checkbox locator to target checked state.
    [Arguments]    ${NAME}
    ${SELECTOR}=    Get Locator In Category    checkbox    ${NAME}
    Click    css=${SELECTOR}

Checkbox Should Be Visible
    [Documentation]    Assert that a checkbox locator is visible.
    [Arguments]    ${NAME}
    Category Element Should Be Visible    checkbox    ${NAME}
