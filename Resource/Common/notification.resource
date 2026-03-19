*** Settings ***
Documentation       Notification interaction keywords.

Resource            common.resource


*** Keywords ***
Notification '${NAME}' Should Be Visible
    [Documentation]    Assert that a notification locator is visible.

    Category Element Should Be Visible    notification    ${NAME}

Notification '${NAME}' Should Not Be Visible
    [Documentation]    Assert that a notification locator is not visible.

    Category Element Should Not Be Visible    notification    ${NAME}

Notification '${NAME}' Should Contain Text '${EXPECTED_TEXT}'
    [Documentation]    Assert notification text contains expected content.

    Category Element Text Should Contain    notification    ${NAME}    ${EXPECTED_TEXT}
