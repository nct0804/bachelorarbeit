*** Settings ***
Documentation       List interaction keywords.

Resource            common.resource


*** Keywords ***
Click List Item '${NAME}'
    [Documentation]    Click a list locator by logical name.

    Click Category Element    list    ${NAME}

Click List Item '${NAME}' At Index
    [Documentation]    Click a list locator using an index for repeated selectors.
    [Arguments]    ${INDEX}=0

    Click Category Element At Index    list    ${NAME}    ${INDEX}

List '${NAME}' Should Be Visible
    [Documentation]    Assert that a list locator is visible. 

    Category Element Should Be Visible    list    ${NAME}

List Item '${NAME}' Count Should Be At Least
    [Documentation]    Assert that list locator has at least expected item count.
    [Arguments]    ${MIN_COUNT}=1

    ${COUNT}=    Get Category Element Count    list    ${NAME}
    ${COUNT_OK}=    Evaluate    int($COUNT) >= int($MIN_COUNT)
    Should Be True    ${COUNT_OK}
