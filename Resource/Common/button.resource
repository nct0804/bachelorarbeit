*** Settings ***
Documentation       Button interaction keywords.

Resource            common.resource


*** Keywords ***
Click Button
    [Documentation]    Click a button locator by logical name.
    [Tags]    Basic
    [Arguments]    ${NAME}
    Click Category Element    button    ${NAME}

Click Button At Index
    [Documentation]    Click a button locator using an index for repeated selectors.
    [Tags]    Basic
    [Arguments]    ${NAME}    ${INDEX}=0
    Click Category Element At Index    button    ${NAME}    ${INDEX}

Button Should Be Visible
    [Documentation]    Assert that a button locator is visible.
    [Tags]    Basic
    [Arguments]    ${NAME}
    Category Element Should Be Visible    button    ${NAME}

the user clicks the '${Button}' button
    [Documentation]    Click the named button on the current page.
    [Tags]    Gherkin
    Click Button    ${Button}

the user clicks the '${Button}' button at index '${Index}'
    [Documentation]    Click the named repeated button at the given index.
    [Tags]    Gherkin
    Click Button At Index    ${Button}    ${Index}

the '${Button}' button should be visible
    [Documentation]    Assert that the named button is visible.
    [Tags]    Gherkin
    Button Should Be Visible    ${Button}
