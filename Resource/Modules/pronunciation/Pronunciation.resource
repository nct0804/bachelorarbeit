*** Settings ***
Documentation       Pronunciation module keywords.

Resource            ../../Common/__lib.resource


*** Keywords ***
Go To Pronunciation Page
    [Documentation]    Navigate to the Pronunciation page and validate it is opened.

    Navigate To Page 'Pronunciation'
    Validate Page 'Pronunciation' Is Opened

Pronunciation Page Should Be Ready
    [Documentation]    Validate pronunciation groups and sounds are visible.

    Validate Page 'Pronunciation' Is Opened
    Validate Category Elements If Present    list    Group    Sound

Select Pronunciation Group At Index
    [Documentation]    Select a pronunciation group by index.
    [Arguments]    ${INDEX}=0

    Click List Item 'Group' At Index '${INDEX}'

Select Pronunciation Sound At Index
    [Documentation]    Select a pronunciation sound by index.
    [Arguments]    ${INDEX}=0

    Click List Item 'Sound' At Index '${INDEX}'

Pronunciation Loading Should Be Visible
    [Documentation]    Assert the pronunciation loading message is visible.

    Messagebox 'Loading' Should Be Visible

Pronunciation Error Should Be Visible
    [Documentation]    Assert the pronunciation error message is visible.

    Messagebox 'Error' Should Be Visible
