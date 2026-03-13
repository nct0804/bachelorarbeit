*** Settings ***
Documentation       Library resource for About Us Page

Resource            AboutUs.resource


*** Keywords ***
Go To About Us Page
    [Documentation]    Navigate to the About Us page and validate it is opened.
    Navigate To Page    about us
    Validate Page Is Opened    about us
