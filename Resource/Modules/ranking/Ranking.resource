*** Settings ***
Documentation       Ranking module keywords.

Resource            ../../Common/__lib.resource


*** Keywords ***
Go To Ranking Page
    [Documentation]    Navigate to the Ranking page and validate it is opened.

    Navigate To Page    Ranking
    Validate Page Is Opened    Ranking

Ranking Page Should Be Ready
    [Documentation]    Validate ranking content panels are visible.

    Validate Page Is Opened    Ranking
    Validate Category Elements If Present    list    Card    List
    Validate Category Elements If Present    tab    Tabs

Select Ranking Tab
    [Documentation]    Select a ranking tab by name.
    [Arguments]    ${TAB}

    Click Button    ${TAB}

Ranking List Should Have Items
    [Documentation]    Assert the ranking list has at least one entry.
    [Arguments]    ${MIN_COUNT}=1

    List Item Count Should Be At Least    Item    ${MIN_COUNT}
