*** Settings ***
Documentation       Locator map loader and resolver

Resource            ../MainLib.resource
Library             Collections
Library             OperatingSystem
Library             String


*** Variables ***
${LOC}              ${EMPTY}
${CURRENT_PAGE}     ${EMPTY}
${LOCATOR_FILE}     ${EMPTY}


*** Keywords ***
Clear Locators
    [Documentation]    Clear the current locator map and page context.
    [Tags]    basic
    Set Suite Variable    ${LOC}    ${EMPTY}
    Set Suite Variable    ${CURRENT_PAGE}    ${EMPTY}
    Set Suite Variable    ${LOCATOR_FILE}    ${EMPTY}

Load Locators
    [Documentation]    Load locators by matching the page name against locator aliases.
    [Tags]    basic
    [Arguments]    ${PAGE}
    Clear Locators
    ${FILE}=    Get Locator File For Page    ${PAGE}
    ${RAW}=    Get File    ${FILE}
    ${DATA}=    Evaluate    json.loads($RAW)    json
    Set Suite Variable    ${LOC}    ${DATA}
    Set Suite Variable    ${CURRENT_PAGE}    ${PAGE}
    Set Suite Variable    ${LOCATOR_FILE}    ${FILE}

Get Locator File For Page
    [Documentation]    Find the locator file whose aliases contain the given page name.
    [Tags]    basic
    [Arguments]    ${PAGE}
    ${MODULES_DIR}=    Set Variable    ${CURDIR}/../Modules
    @{DIRS}=    List Directories In Directory    ${MODULES_DIR}
    ${PAGE_LOWER}=    Convert To Lowercase    ${PAGE}
    FOR    ${DIR}    IN    @{DIRS}
        ${FILE}=    Set Variable    ${MODULES_DIR}/${DIR}/__Locators.json
        ${EXISTS}=    Run Keyword And Return Status    File Should Exist    ${FILE}
        IF    ${EXISTS}
            ${RAW}=    Get File    ${FILE}
            ${DATA}=    Evaluate    json.loads($RAW)    json
            ${ALIASES}=    Get From Dictionary    ${DATA}    page
            ${IS_LIST}=    Evaluate    isinstance($ALIASES, list)
            IF    ${IS_LIST}
                ${ALIAS_LIST}=    Set Variable    ${ALIASES}
            ELSE
                ${ALIAS_LIST}=    Create List    ${ALIASES}
            END
            ${MATCH}=    Set Variable    ${FALSE}
            FOR    ${ALIAS}    IN    @{ALIAS_LIST}
                ${ALIAS_LOWER}=    Convert To Lowercase    ${ALIAS}
                IF    '${ALIAS_LOWER}' == '${PAGE_LOWER}'
                    ${MATCH}=    Set Variable    ${TRUE}
                    BREAK
                END
            END
            IF    ${MATCH}    RETURN    ${FILE}
        END
    END
    Fail    No locator file found for page: ${PAGE}

Get Locator
    [Documentation]    Get the locator value by its path in the locator map.
    [Tags]    basic
    [Arguments]    ${PATH}
    ${PARTS}=    Split String    ${PATH}    .
    ${VALUE}=    Set Variable    ${LOC}
    FOR    ${P}    IN    @{PARTS}
        ${VALUE}=    Get From Dictionary    ${VALUE}    ${P}
    END
    RETURN    ${VALUE}

Get Current Page
    [Documentation]    Get the current page name.
    [Tags]    basic
    RETURN    ${CURRENT_PAGE}

Get Locator File
    [Documentation]    Get the current locator file path.
    [Tags]    basic
    RETURN    ${LOCATOR_FILE}

Validate '${PAGE}' Is Opened
    [Documentation]    Verify that the expected page is opened by a unique root element.
    [Tags]    basic
    Load Locators    ${PAGE}
    Wait For Load State    networkidle    timeout=10s
    ${PAGE_LOCATOR}=    Get Locator    root
    Wait For Elements State    css=${PAGE_LOCATOR}    visible    timeout=30s

the '${PAGE}' page should be opened
    [Documentation]    Verify that the expected page is opened.
    [Tags]    gherkin
    Validate '${PAGE}' Is Opened

the user is on the '${PAGE}' page
    [Documentation]    Load locator map for a page name and validate its root element.
    [Tags]    gherkin
    Validate '${PAGE}' Is Opened
