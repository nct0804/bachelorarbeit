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

the '${Messagebox}' messagebox should be visible
    [Documentation]    Assert that the named messagebox is visible.
    [Tags]    Gherkin
    Messagebox Should Be Visible    ${Messagebox}

the '${Messagebox}' messagebox should contain '${Text}'
    [Documentation]    Assert named messagebox contains expected text.
    [Tags]    Gherkin
    Messagebox Should Contain Text    ${Messagebox}    ${Text}
