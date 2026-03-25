*** Settings ***
Documentation       Library resource for Home Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
Welcome Page Validation
    [Documentation]    Validate core welcome page sections are visible.

    Validate Page Is Opened    Welcome Page
    Validate Category Elements If Present    section
    ...    Hero
    ...    Features
    ...    Reviews
    ...    About
    ...    Benefits
    ...    Course Features
    ...    About Us
    ...    What Our Students Say
