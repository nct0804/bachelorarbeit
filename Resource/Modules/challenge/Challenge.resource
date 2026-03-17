*** Settings ***
Documentation       Library resource for Challenge Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
Go To Challenge Page
    [Documentation]    Navigate to the Challenge page and validate it is opened.
    Navigate To Page 'challenge'
    Validate Page 'challenge' Is Opened    

Challenge Page Should Be Ready
    [Documentation]    Validate challenge page categories are visible.

    Validate Page 'challenge' Is Opened
    Validate Category Elements If Present    button
    ...    All
    ...    Grammar
    ...    Vocabulary
    ...    Listening
    ...    Numbers
    ...    Speaking

Select Challenge Category
    [Documentation]    Select a challenge category by name.
    [Arguments]    ${CATEGORY}

    Click Button '${CATEGORY}'

Start Challenge Card At Index
    [Documentation]    Start a challenge card by index.
    [Arguments]    ${INDEX}=0

    Click Button 'Card Action' At Index    ${INDEX}
