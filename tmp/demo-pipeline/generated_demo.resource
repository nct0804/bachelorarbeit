*** Settings ***
Documentation    Auto-generated executable resource.
Resource    ../Resource/MainLib.resource

*** Keywords ***
01_01: AI Generative Step
    [Documentation]    Execute source step
    Go To Page    Sign In

01_02: AI Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign In

01_03: AI Generative Step
    [Documentation]    Execute source step
    Click Button    Logo

01_04: AI Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Welcome Page

