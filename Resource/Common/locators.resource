*** Settings ***
Documentation       Locator map loader and resolver

Resource            ../MainLib.resource


*** Variables ***
${LOC}              ${EMPTY}
${CURRENT_PAGE}     ${EMPTY}


*** Keywords ***
Load Locators
    [Documentation]    Load locators from the JSON file of the specified page and store in a suite variable
    [Tags]    basic
    [Arguments]    ${page}
    ${path}=    Set Variable    ${CURDIR}/../Modules/${page}/__Locators.json
    ${raw}=    Get File    ${path}
    ${data}=    Evaluate    json.loads($raw)    json
    Set Suite Variable    ${LOC}    ${data}
    Set Suite Variable    ${CURRENT_PAGE}    ${page}

Get Locator
    [Documentation]    Get the locator value by its path in the locator map
    [Tags]    basic
    [Arguments]    ${path}
    ${parts}=    Split String    ${path}    .
    ${value}=    Set Variable    ${LOC}
    FOR    ${p}    IN    @{parts}
        ${value}=    Get From Dictionary    ${value}    ${p}
    END
    RETURN    ${value}

Get Page URL
    [Documentation]    Get the page URL from the pages map
    [Tags]    basic
    RETURN    ${LOC}[url]

Get Current Page
    [Documentation]    Get the current page name
    [Tags]    basic
    RETURN    ${CURRENT_PAGE}
