*** Settings ***
Documentation       Pronunciation module keywords.

Resource            ../../Common/__lib.resource


*** Keywords ***
Go To Pronunciation Page
    [Documentation]    Navigate to the Pronunciation page and validate it is opened.

    Navigate To Page    Pronunciation
    Validate Page Is Opened    Pronunciation

Pronunciation Page Should Be Ready
    [Documentation]    Validate pronunciation groups and sounds are visible.

    Validate Page Is Opened    Pronunciation
    Validate Category Elements If Present    list    Group    Sound

Select Pronunciation Group At Index
    [Documentation]    Select a pronunciation group by index.
    [Arguments]    ${INDEX}=0

    Click List Item At Index    Group    ${INDEX}

Select Pronunciation Sound At Index
    [Documentation]    Select a pronunciation sound by index.
    [Arguments]    ${INDEX}=0

    Click List Item At Index    Sound    ${INDEX}

Pronunciation Loading Should Be Visible
    [Documentation]    Assert the pronunciation loading message is visible.

    Messagebox Should Be Visible    Loading

Pronunciation Error Should Be Visible
    [Documentation]    Assert the pronunciation error message is visible.

    Messagebox Should Be Visible    Error
