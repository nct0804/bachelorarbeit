*** Settings ***
Documentation       Ranking module keywords.

Resource            ../../Common/__lib.resource


*** Keywords ***
Ranking Page Validation
    [Documentation]    Validate ranking content panels are visible.

    Validate Page 'Ranking' Is Opened
    Validate Category Elements If Present    list    Card    List
    Validate Category Elements If Present    tab    Tabs
