*** Settings ***
Documentation       List interaction keywords.

Resource            common.resource


*** Keywords ***
List Should Be Visible
    [Documentation]    Assert that a list locator is visible.
    [Tags]    Basic
    [Arguments]    ${NAME}
    Category Element Should Be Visible    list    ${NAME}

List Item Count Should Be At Least
    [Documentation]    Assert that list locator has at least expected item count.
    [Tags]    Basic
    [Arguments]    ${NAME}    ${MIN_COUNT}=1
    ${COUNT}=    Get Category Element Count    list    ${NAME}
    ${COUNT_OK}=    Evaluate    int($COUNT) >= int($MIN_COUNT)
    Should Be True    ${COUNT_OK}

the '${List}' list should be visible
    [Documentation]    Assert that the named list is visible.
    [Tags]    Gherkin
    List Should Be Visible    ${List}

the '${List}' list should have at least '${Count}' items
    [Documentation]    Assert list has at least the expected number of items.
    [Tags]    Gherkin
    List Item Count Should Be At Least    ${List}    ${Count}

