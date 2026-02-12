*** Settings ***
Documentation       Locator map loader and resolver

Resource            ../MainLib.resource


*** Keywords ***
Load Locators
    [Documentation]    Load locators from the JSON file of the specified page and store in a suite variable
    [Arguments]    ${page}
    ${path}=    Set Variable    ${CURDIR}/../Modules/${page}/__Locators.json
    ${raw}=    Get File    ${path}
    ${data}=    Evaluate    json.loads($raw)    json
    Set Suite Variable    ${LOC}    ${data}

Get Locator
    [Documentation]    Get the locator value by its path in the locator map
    [Arguments]    ${path}
    ${parts}=    Split String    ${path}    .
    ${value}=    Set Variable    ${LOC}
    FOR    ${p}    IN    @{parts}
        ${value}=    Get From Dictionary    ${value}    ${p}
    END
    RETURN    ${value}

Click Button
    [Documentation]    Click a button using its locator from the locator map
    [Arguments]    ${name}
    ${selector}=    Get Locator    button.${name}
    Click    css=${selector}
