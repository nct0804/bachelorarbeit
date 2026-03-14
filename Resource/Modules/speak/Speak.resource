*** Settings ***
Documentation       Speak module keywords.

Resource            ../../Common/__lib.resource


*** Keywords ***
Go To Speak Page
    [Documentation]    Navigate to the Speak page and validate it is opened.

    Navigate To Page    Speak
    Validate Page Is Opened    Speak

Speak Page Should Be Ready
    [Documentation]    Validate the Speak page is opened.

    Validate Page Is Opened    Speak
