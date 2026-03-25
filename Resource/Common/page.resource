*** Settings ***
Documentation       page interaction keywords.

Resource            common.resource


*** Keywords ***
Page Should Be Ready
    [Documentation]    Validate the specified page is opened.
    [Arguments]    ${PAGE}
    Validate Page Is Opened    ${PAGE}

Go To Page
    [Documentation]    Navigate to the specified page and validate it is opened.
    [Arguments]    ${PAGE}
    Navigate To Page    ${PAGE}
    Validate Page Is Opened    ${PAGE}
