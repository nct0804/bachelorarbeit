*** Settings ***
Documentation       Checkbox interaction keywords.

Resource            common.resource


*** Keywords ***
Set Checkbox
    [Documentation]    Set checkbox locator to target checked state.
    [Tags]    basic
    [Arguments]    ${NAME}
    ${SELECTOR}=    Get Locator In Category    checkbox    ${NAME}
    Click    css=${SELECTOR}

Checkbox Should Be Visible
    [Documentation]    Assert that a checkbox locator is visible.
    [Tags]    basic
    [Arguments]    ${NAME}
    Category Element Should Be Visible    checkbox    ${NAME}

the user clicks the '${Checkbox}' checkbox
    [Documentation]    Set the named checkbox to provided state.
    [Tags]    gherkin
    Set Checkbox    ${Checkbox}

the '${Checkbox}' checkbox should be visible
    [Documentation]    Assert that the named checkbox is visible.
    [Tags]    gherkin
    Checkbox Should Be Visible    ${Checkbox}
