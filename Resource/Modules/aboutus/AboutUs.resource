*** Settings ***
Documentation       Library resource for About Us Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
About Us Page Should Be Ready
    [Documentation]    Validate the About Us page is opened.

    Validate Page 'About Us' Is Opened
