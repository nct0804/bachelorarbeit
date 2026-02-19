*** Settings ***
Documentation       Text interaction keywords.

Resource            common.resource


*** Keywords ***
Click Text
    [Documentation]    Click a text locator by logical name.
    [Tags]    Basic
    [Arguments]    ${NAME}
    Click Category Element    text    ${NAME}

Text Should Be Visible
    [Documentation]    Assert that a text locator is visible.
    [Tags]    Basic
    [Arguments]    ${NAME}
    Category Element Should Be Visible    text    ${NAME}

the user clicks the '${Text}' text
    [Documentation]    Click the named text element on the current page.
    [Tags]    Gherkin
    Click Text    ${Text}

the '${Text}' text should be visible
    [Documentation]    Assert that the named text element is visible.
    [Tags]    Gherkin
    Text Should Be Visible    ${Text}
