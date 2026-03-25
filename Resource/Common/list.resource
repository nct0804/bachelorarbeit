*** Settings ***
Documentation       List interaction keywords.

Resource            common.resource


*** Keywords ***
Click List Item At Index
    [Documentation]    Click a list locator using an index. Supports both {index} placeholders and nth-based selection.
    [Arguments]    ${NAME}    ${INDEX}
    Click Category Element At Index    list    ${NAME}    ${INDEX}

List Should Be Visible
    [Documentation]    Assert that a list locator is visible.
    [Arguments]    ${NAME}
    Category Element Should Be Visible    list    ${NAME}

List Item Count Should Be At Least
    [Documentation]    Assert that list locator has at least expected item count.
    [Arguments]    ${NAME}    ${MIN_COUNT}=1

    ${COUNT}=    Get Category Element Count    list    ${NAME}
    ${COUNT_OK}=    Evaluate    int($COUNT) >= int($MIN_COUNT)
    Should Be True    ${COUNT_OK}
