*** Settings ***
Documentation       Notification interaction keywords.

Resource            common.resource


*** Keywords ***
Notification Should Be Visible
    [Documentation]    Assert that a notification locator is visible.
    [Tags]    Basic
    [Arguments]    ${NAME}
    Category Element Should Be Visible    notification    ${NAME}

Notification Should Contain Text
    [Documentation]    Assert notification text contains expected content.
    [Tags]    Basic
    [Arguments]    ${NAME}    ${EXPECTED_TEXT}
    Category Element Text Should Contain    notification    ${NAME}    ${EXPECTED_TEXT}

the '${Notification}' notification should be visible
    [Documentation]    Assert that the named notification is visible.
    [Tags]    Gherkin
    Notification Should Be Visible    ${Notification}

the '${Notification}' notification should contain '${Text}'
    [Documentation]    Assert named notification contains expected text.
    [Tags]    Gherkin
    Notification Should Contain Text    ${Notification}    ${Text}
