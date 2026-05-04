*** Settings ***
Documentation    Auto-generated executable resource.
Resource    ../Resource/MainLib.resource

*** Keywords ***
01_01: AI Generative Step
    [Documentation]    Execute source step
    Navigate To Page    Sign In

01_02: AI Generative Step
    [Documentation]    Execute source step
    Sign In With Credentials

01_03: AI Generative Step
    [Documentation]    Execute source step
    Page Should Be Ready    Main Page

01_04: AI Generative Step
    [Documentation]    Execute source step
    Go To Page    main

01_05: AI Generative Step
    [Documentation]    Execute source step
    Click Button    Achievements

01_06: AI Generative Step
    [Documentation]    Execute source step
    Page Should Be Ready    Achievements

01_07: AI Generative Step
    [Documentation]    Execute source step
    Section Should Be Visible    Your Badges

