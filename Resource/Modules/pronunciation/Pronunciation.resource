*** Settings ***
Documentation       Pronunciation module keywords.

Resource            ../../Common/__lib.resource


*** Keywords ***
Pronunciation Page Should Be Ready
    [Documentation]    Validate pronunciation groups and sounds are visible.

    Validate Page Is Opened    Pronunciation
    Validate Category Elements If Present    list    Group    Sound

Select Pronunciation Group At Index
    [Documentation]    Select a pronunciation group by index.
    [Arguments]    ${INDEX}=01
    Click List Item At Index    Group    ${INDEX}

Select Pronunciation Sound At Index
    [Documentation]    Select a pronunciation sound by index.
    [Arguments]    ${INDEX}=1

    Click List Item At Index    Sound    ${INDEX}

Pronunciation Message Should Be Visible
    [Documentation]    Assert the pronunciation loading message is visible.
    [Arguments]    ${MESSAGE}
    Messagebox Should Be Visible    ${MESSAGE}
