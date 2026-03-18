*** Settings ***
Documentation       Library resource for Challenge Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
Select Challenge Category
    [Documentation]    Select a challenge category by name.
    [Arguments]    ${CATEGORY}

    Click Button '${CATEGORY}'

Start Challenge Card At Index
    [Documentation]    Start a challenge card by index.
    [Arguments]    ${INDEX}=0

    Click Button 'Card Action' At Index    ${INDEX}
