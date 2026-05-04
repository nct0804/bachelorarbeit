*** Settings ***
Documentation       Message box interaction keywords.

Resource            common.resource


*** Keywords ***
Messagebox Should Be Visible
    [Documentation]    Assert that a messagebox locator is visible.
    [Arguments]    ${NAME}
    Category Element Should Be Visible    messagebox    ${NAME}

Messagebox Should Not Be Visible
    [Documentation]    Assert that a messagebox locator is not visible.
    [Arguments]    ${NAME}

    Category Element Should Not Be Visible    messagebox    ${NAME}

Messagebox Should Contain Text
    [Documentation]    Assert messagebox text contains expected content.
    [Arguments]    ${NAME}    ${EXPECTED_TEXT}

    Category Element Text Should Contain    messagebox    ${NAME}    ${EXPECTED_TEXT}

Messagebox Should Be Empty
    [Documentation]    Assert messagebox text is empty.
    [Arguments]    ${NAME}

    Category Element Text Should Be Empty    messagebox    ${NAME}
