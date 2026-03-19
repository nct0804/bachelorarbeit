*** Settings ***
Documentation       List interaction keywords.

Resource            common.resource


*** Keywords ***
Click List Item '${NAME}' At Index '${INDEX}'
    [Documentation]    Click a list locator using an index. Supports both {index} placeholders and nth-based selection.

    Click Category Element At Index    list    ${NAME}    ${INDEX}

List '${NAME}' Should Be Visible
    [Documentation]    Assert that a list locator is visible.

    Category Element Should Be Visible    list    ${NAME}

List Item '${NAME}' Count Should Be At Least '${MIN_COUNT}'
    [Documentation]    Assert that list locator has at least expected item count.
    [Arguments]    ${MIN_COUNT}=1

    ${COUNT}=    Get Category Element Count    list    ${NAME}
    ${COUNT_OK}=    Evaluate    int($COUNT) >= int($MIN_COUNT)
    Should Be True    ${COUNT_OK}
