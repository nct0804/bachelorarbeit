*** Settings ***
Documentation       Library resource for Challenge Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
Go To Challenge Page
    [Documentation]    Navigate to the Challenge page and validate it is opened.
    [Tags]    challenge
    Navigate To Page    challenge
    Validate Page Is Opened    challenge
