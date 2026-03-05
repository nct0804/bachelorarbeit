*** Settings ***
Documentation       Message box interaction keywords.

Resource            common.resource


*** Keywords ***
Messagebox Should Be Visible
    [Documentation]    Assert that a messagebox locator is visible.
    [Tags]    Basic
    [Arguments]    ${NAME}
    Category Element Should Be Visible    messagebox    ${NAME}

Messagebox Should Contain Text
    [Documentation]    Assert messagebox text contains expected content.
    [Tags]    Basic
    [Arguments]    ${NAME}    ${EXPECTED_TEXT}
    Category Element Text Should Contain    messagebox    ${NAME}    ${EXPECTED_TEXT}