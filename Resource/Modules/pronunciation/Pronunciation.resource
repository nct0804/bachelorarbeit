*** Settings ***
Documentation       Pronunciation module keywords.

Resource            ../../Common/__lib.resource


*** Keywords ***
Pronunciation Page Should Be Ready
    [Documentation]    Validate pronunciation groups and sounds are visible.

    Validate Page 'Pronunciation' Is Opened
    Validate Category Elements If Present    list    Group    Sound

Select Pronunciation Group At Index
    [Documentation]    Select a pronunciation group by index.
    [Arguments]    ${INDEX}=1
    Click List Item 'Group' At Index '${INDEX}'

Select Pronunciation Sound At Index
    [Documentation]    Select a pronunciation sound by index.
    [Arguments]    ${INDEX}=1

    Click List Item 'Sound' At Index '${INDEX}'

Pronunciation '${MESSAGE}' Should Be Visible
    [Documentation]    Assert the pronunciation loading message is visible.

    Messagebox '${MESSAGE}' Should Be Visible
