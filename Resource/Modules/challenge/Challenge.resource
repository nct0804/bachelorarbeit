*** Settings ***
Documentation       Library resource for Challenge Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
Select Challenge Category
    [Documentation]    Select a challenge category by name.
    [Arguments]    ${CATEGORY}
    Go To Page    Challenge
    Click Button    ${CATEGORY}

Start Challenge Card At '${INDEX}'
    [Documentation]    Start a challenge card by index.

    Click Button At Index    Card Action    ${INDEX}
