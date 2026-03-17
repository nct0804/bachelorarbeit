*** Settings ***
Documentation       Library resource for Inbox Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
Go To Inbox Page
    [Documentation]    Navigate to the Inbox page and validate it is opened.

    Navigate To Page 'Inbox'
    Validate Page 'Inbox' Is Opened

Inbox Page Should Be Ready
    [Documentation]    Validate the Inbox page is opened.

    Validate Page 'Inbox' Is Opened
