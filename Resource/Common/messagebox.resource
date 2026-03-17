*** Settings ***
Documentation       Message box interaction keywords.

Resource            common.resource


*** Keywords ***
Messagebox '${NAME}' Should Be Visible
    [Documentation]    Assert that a messagebox locator is visible.

    Category Element Should Be Visible    messagebox    ${NAME}

Messagebox '${NAME}' Should Not Be Visible
    [Documentation]    Assert that a messagebox locator is not visible.

    Category Element Should Not Be Visible    messagebox    ${NAME}

Messagebox '${NAME}' Should Contain Text '${EXPECTED_TEXT}'
    [Documentation]    Assert messagebox text contains expected content.

    Category Element Text Should Contain    messagebox    ${NAME}    ${EXPECTED_TEXT}
