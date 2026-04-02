*** Settings ***
Documentation       Library resource for Learn Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
Select Learn Option At Index
    [Documentation]    Select a learn option by index.
    [Arguments]    ${INDEX}=1

    Click List Item At Index    Option    ${INDEX}

Fill Learn Blank Input Answer
    [Documentation]    Fill the blank input with the provided answer.
    [Arguments]    ${ANSWER}
    Fill Textbox With Value    Blank Input    ${ANSWER}

Submit Learn Check
    [Documentation]    Submit the current learn exercise for checking.

    Click Button    Check
    Messagebox Should Be Visible    Check Result

Try Learn Again
    [Documentation]    Retry the current learn exercise.

    Click Button    Try Again

Exit Learn Session
    [Documentation]    Exit the learn session and return to the main page.

    Click Button    Exit
    Messagebox Should Be Visible    Exit Modal
    Click Button    Back to Home
    Validate Page Is Opened    Main Page
