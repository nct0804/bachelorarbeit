*** Settings ***
Documentation    Auto-generated executable resource.
Resource    ../Resource/MainLib.resource

*** Keywords ***
01_01: RAG Generative Step
    [Documentation]    Execute source step
    Go To Page    Sign In

01_02: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign In

01_03: RAG Generative Step
    [Documentation]    Execute source step
    Click Link    Sign Up

01_04: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign Up

02_01: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign In

02_02: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign In

02_03: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Email Address    chithien.nguyen@germangains.com

02_04: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Password    password123

02_05: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign In

02_06: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Main Page

03_01: RAG Generative Step
    [Documentation]    Execute source step
    Go To Page    Sign In

03_02: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Email Address    chithien.nguyen@germangains.com

03_03: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Password    password123

03_04: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign In

03_05: RAG Generative Step
    [Documentation]    Execute source step
    Page Should Be Ready    Main Page

03_06: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Main Learning

03_07: RAG Generative Step
    [Documentation]    Execute source step
    Page Should Be Ready    Main Learning Page

04_01: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign In

04_02: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign In

04_03: RAG Generative Step
    [Documentation]    Execute source step
    Set Value In The Textbox    Email Address    invalid@email.com

04_04: RAG Generative Step
    [Documentation]    Execute source step
    Set Value In The Textbox    Password    invalidpassword

04_05: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign In

04_06: RAG Generative Step
    [Documentation]    Execute source step
    Notification Should Be Visible    Error

04_07: RAG Generative Step
    [Documentation]    Execute source step
    Notification Should Contain Text    Error    Invalid credentials

05_01: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign In

05_02: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign In

05_03: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Email Address    invalid@email.com

05_04: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Password    wrongpassword

05_05: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign In

05_06: RAG Generative Step
    [Documentation]    Execute source step
    Notification Should Be Visible    Error

05_07: RAG Generative Step
    [Documentation]    Execute source step
    Notification Should Contain Text    Error    Invalid credentials

06_01: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign Up

06_02: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign Up

07_01: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign Up

07_02: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign Up

08_01: RAG Generative Step
    [Documentation]    Execute source step
    Go To Page    Sign Up

08_02: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign Up

08_03: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Email Address    Test@gmail.com

08_04: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Password    testtest123

08_05: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Confirm Password    testtest123

08_06: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign Up

08_07: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign In

08_08: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Email Address    Test@gmail.com

08_09: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Password    testtest123

08_10: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign In

08_11: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Main Page

08_12: RAG Generative Step
    [Documentation]    Execute source step
    Go To Page    Main Learning Page

08_13: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Main Learning Page

09_01: RAG Generative Step
    [Documentation]    Execute source step
    Go To Page    Sign Up

09_02: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign Up

09_03: RAG Generative Step
    [Documentation]    Execute source step
    Set Value In The Textbox    Email Address    newuser@example.com

09_04: RAG Generative Step
    [Documentation]    Execute source step
    Set Value In The Textbox    Password    newpassword123

09_05: RAG Generative Step
    [Documentation]    Execute source step
    Set Value In The Textbox    Confirm Password    newpassword123

09_06: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign Up

09_07: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign In

09_08: RAG Generative Step
    [Documentation]    Execute source step
    Set Value In The Textbox    Email Address    newuser@example.com

09_09: RAG Generative Step
    [Documentation]    Execute source step
    Set Value In The Textbox    Password    newpassword123

09_10: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign In

09_11: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Main Page

09_12: RAG Generative Step
    [Documentation]    Execute source step
    Go To Page    Main Learning Page

09_13: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Main Learning Page

10_01: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Welcome Page

10_02: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Features

10_03: RAG Generative Step
    [Documentation]    Execute source step
    Scroll To Section    Course Features

10_04: RAG Generative Step
    [Documentation]    Execute source step
    Section Should Be Visible    Course Features

11_01: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Features

11_02: RAG Generative Step
    [Documentation]    Execute source step
    Scroll To Section    Course Features

11_03: RAG Generative Step
    [Documentation]    Execute source step
    Validate Section Is In View    Course Features

12_01: RAG Generative Step
    [Documentation]    Execute source step
    Go To Page    Sign In

12_02: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Logo

12_03: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Welcome Page

13_01: RAG Generative Step
    [Documentation]    Execute source step
    Go To Page    Sign In

13_02: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign In

13_03: RAG Generative Step
    [Documentation]    Execute source step
    Checkbox Should Be Visible    Remember Me

13_04: RAG Generative Step
    [Documentation]    Execute source step
    Checkbox State Should Be    Remember Me    checked

14_01: RAG Generative Step
    [Documentation]    Execute source step
    Go To Page    Sign In

14_02: RAG Generative Step
    [Documentation]    Execute source step
    Checkbox State Should Be    Remember Me    unchecked

15_01: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Features

15_02: RAG Generative Step
    [Documentation]    Execute source step
    Scroll To Section    Features

15_03: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Reviews

15_04: RAG Generative Step
    [Documentation]    Execute source step
    Scroll To Section    Reviews

15_05: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    About

15_06: RAG Generative Step
    [Documentation]    Execute source step
    Scroll To Section    About

16_01: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign In

16_02: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Sign In

16_03: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Email Address    chithien.nguyen@germangains.com

16_04: RAG Generative Step
    [Documentation]    Execute source step
    Fill Textbox With Value    Password    password123

16_05: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Sign In

16_06: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Main Page

16_07: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Main Learning

16_08: RAG Generative Step
    [Documentation]    Execute source step
    Validate Page Is Opened    Main Learning Page

16_09: RAG Generative Step
    [Documentation]    Execute source step
    Scroll To Section    Course

16_10: RAG Generative Step
    [Documentation]    Execute source step
    Click Button At Index    Continue    1

16_11: RAG Generative Step
    [Documentation]    Execute source step
    Click List Item At Index    Lesson    1

16_12: RAG Generative Step
    [Documentation]    Execute source step
    Click Button    Start

