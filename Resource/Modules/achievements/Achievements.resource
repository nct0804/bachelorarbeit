*** Settings ***
Documentation       Library resource for Achievements Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
Go To Achievements Page
    [Documentation]    Navigate to the Achievements page and validate it is opened.

    Navigate To Page 'Achievements'
    Validate Page 'Achievements' Is Opened    
 
Achievements Page Should Be Ready
    [Documentation]    Validate the Achievements page is opened.

    Validate Page 'Achievements' Is Opened   
