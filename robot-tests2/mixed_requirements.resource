*** Settings ***
Documentation    Auto-generated executable resource.
Resource    ../Resource/MainLib.resource

*** Keywords ***
01_01: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Email Address    test@email.com

01_02: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Password    password123

01_03: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign In

02_01: RAG Generative Step
    [Documentation]    Execute source step
    Navigate To Page    Login

02_02: RAG Generative Step
    [Documentation]    Execute source step
    Page Should Be Ready    Login

02_03: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Username    testuser

02_04: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Password    password123

02_05: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Login

02_06: RAG Generative Step
    [Documentation]    Execute source step
    Page Should Be Ready    Dashboard

02_07: RAG Generative Step
    [Documentation]    Execute source step
    Click Tab    Challenge

03_01: RAG Generative Step
    [Documentation]    Execute source step
    Navigate To Page    Main Learning

03_02: RAG Generative Step
    [Documentation]    Execute source step
    Page Should Be Ready    Main Learning

03_03: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Main Learning

04_01: RAG Generative Step
    [Documentation]    Execute source step
    Open Page 'sign up page' From Main Navigation By Clicking 'sign in text link' Button

05_01: RAG Generative Step
    [Documentation]    Execute source step
    Notification Should Be Visible    Error

06_01: RAG Generative Step
    [Documentation]    Execute source step
    Checkbox Should Be Visible    Remember Me

06_02: RAG Generative Step
    [Documentation]    Execute source step
    Page Should Be Ready    Sign In

06_03: RAG Generative Step
    [Documentation]    Execute source step
    Resolve Page Route    Sign In

06_04: RAG Generative Step
    [Documentation]    Execute source step
    Go To Page    Sign In

06_05: RAG Generative Step
    [Documentation]    Execute source step
    Navigate To Page    Sign In

06_06: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign In

07_01: RAG Generative Step
    [Documentation]    Execute source step
    Wait For Category Element State    Login    Username Field    visible    15s

07_02: RAG Generative Step
    [Documentation]    Execute source step
    Fill Category Element    Login    Username Field    invalid_user

07_03: RAG Generative Step
    [Documentation]    Execute source step
    Fill Category Element    Login    Password Field    invalid_password

07_04: RAG Generative Step
    [Documentation]    Execute source step
    Click Category Element    Login    Login Button

07_05: RAG Generative Step
    [Documentation]    Execute source step
    Wait For Category Element State    Login    Error Message    visible    15s

07_06: RAG Generative Step
    [Documentation]    Execute source step
    Category Element Text Should Contain    Login    Error Message    Invalid credentials

