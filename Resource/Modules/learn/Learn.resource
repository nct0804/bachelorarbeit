*** Settings ***
Documentation       Library resource for Learn Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
Select Learn Option At Index '${INDEX}'
    [Documentation]    Select a learn option by index.
    [Arguments]    ${INDEX}=0

    Click List Item 'Option' At Index '${INDEX}'

Fill Learn Blank Answer '${ANSWER}'
    [Documentation]    Fill the blank input with the provided answer.

    Fill Textbox 'Fill Blank Input' With Value '${ANSWER}'

Submit Learn Check
    [Documentation]    Submit the current learn exercise for checking.

    Click Button 'Check'
    Messagebox 'Check Result' Should Be Visible

Try Learn Again
    [Documentation]    Retry the current learn exercise.

    Click Button 'Try Again'

Exit Learn Session
    [Documentation]    Exit the learn session and return to the main page.

    Click Button 'Exit'
    Messagebox 'Exit Modal' Should Be Visible
    Click Button 'Back to Home'
    Validate Page 'Main Page' Is Opened
