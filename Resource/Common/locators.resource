*** Settings ***
Documentation       Locator map loader and resolver keywords.

Library             Collections
Library             OperatingSystem
Library             String


*** Variables ***
${LOC}              ${NONE}
${CURRENT_PAGE}     ${EMPTY}
${LOCATOR_FILE}     ${EMPTY}


*** Keywords ***
Normalize Page Name
    [Documentation]    Normalize a page name value for case-insensitive matching.
    [Arguments]    ${PAGE}

    ${TEXT}=    Convert To String    ${PAGE}
    ${TEXT}=    Strip String    ${TEXT}
    ${TEXT}=    Convert To Lowercase    ${TEXT}
    RETURN    ${TEXT}

Clear Locators
    [Documentation]    Clear the current locator map and current page context.

    Set Suite Variable    ${LOC}    ${NONE}
    Set Suite Variable    ${CURRENT_PAGE}    ${EMPTY}
    Set Suite Variable    ${LOCATOR_FILE}    ${EMPTY}

Ensure Locator Map Is Loaded
    [Documentation]    Ensure locators are loaded before locator-based interactions.

    ${HAS_MAP}=    Run Keyword And Return Status    Should Not Be Equal    ${LOC}    ${NONE}
    IF    not ${HAS_MAP}
        Fail    No locator map loaded. Call "the user is on the '<Page>' page" first.
    END

Get Locator File For Page
    [Documentation]    Find locator file whose aliases include the requested page name.
    [Arguments]    ${PAGE}

    ${MODULES_DIR}=    Set Variable    ${CURDIR}/../Modules
    @{DIRS}=    List Directories In Directory    ${MODULES_DIR}
    ${PAGE_KEY}=    Normalize Page Name    ${PAGE}
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
                ${ALIAS_LIST}=    Evaluate    [$ALIASES]
            END
            FOR    ${ALIAS}    IN    @{ALIAS_LIST}
                ${ALIAS_KEY}=    Normalize Page Name    ${ALIAS}
                IF    '${ALIAS_KEY}' == '${PAGE_KEY}'    RETURN    ${FILE}
            END
        END
    END
    Fail    No locator file found for page: ${PAGE}

Load Locators
    [Documentation]    Load locators for a page from its locator JSON file.
    [Arguments]    ${PAGE}

    Clear Locators
    ${FILE}=    Get Locator File For Page    ${PAGE}
    ${RAW}=    Get File    ${FILE}
    ${DATA}=    Evaluate    json.loads($RAW)    json
    Set Suite Variable    ${LOC}    ${DATA}
    Set Suite Variable    ${CURRENT_PAGE}    ${PAGE}
    Set Suite Variable    ${LOCATOR_FILE}    ${FILE}

Get Locator
    [Documentation]    Resolve a locator value by dot-path from the loaded locator map.
    [Arguments]    ${PATH}

    Ensure Locator Map Is Loaded
    @{PARTS}=    Split String    ${PATH}    .
    ${VALUE}=    Set Variable    ${LOC}
    FOR    ${PART}    IN    @{PARTS}
        Dictionary Should Contain Key    ${VALUE}    ${PART}
        ${VALUE}=    Get From Dictionary    ${VALUE}    ${PART}
    END
    RETURN    ${VALUE}

Locator Exists
    [Documentation]    Check if a locator path exists and contains a non-empty selector.
    [Arguments]    ${PATH}

    ${STATUS}    ${VALUE}=    Run Keyword And Ignore Error    Get Locator    ${PATH}
    IF    '${STATUS}' == 'PASS'
        ${HAS_VALUE}=    Run Keyword And Return Status    Should Not Be Empty    ${VALUE}
        IF    ${HAS_VALUE}    RETURN    ${TRUE}
    END
    RETURN    ${FALSE}

Get Locator In Category
    [Documentation]    Resolve selector by category and name from loaded locators.
    [Arguments]    ${CATEGORY}    ${NAME}

    ${PATH}=    Set Variable    ${CATEGORY}.${NAME}
    ${SELECTOR}=    Get Locator    ${PATH}
    Should Not Be Empty    ${SELECTOR}
    RETURN    ${SELECTOR}

Get Locator Names In Category
    [Documentation]    Return non-empty locator names for a category from current page map.
    [Arguments]    ${CATEGORY}

    Ensure Locator Map Is Loaded
    ${HAS_CATEGORY}=    Run Keyword And Return Status    Dictionary Should Contain Key    ${LOC}    ${CATEGORY}
    IF    not ${HAS_CATEGORY}
        @{EMPTY_NAMES}=    Evaluate    []
        RETURN    @{EMPTY_NAMES}
    END
    ${CATEGORY_MAP}=    Get From Dictionary    ${LOC}    ${CATEGORY}
    ${IS_DICT}=    Evaluate    isinstance($CATEGORY_MAP, dict)
    IF    not ${IS_DICT}
        @{EMPTY_NAMES}=    Evaluate    []
        RETURN    @{EMPTY_NAMES}
    END
    @{NAMES}=    Get Dictionary Keys    ${CATEGORY_MAP}
    @{VALID_NAMES}=    Evaluate    []
    FOR    ${NAME}    IN    @{NAMES}
        ${VALUE}=    Get From Dictionary    ${CATEGORY_MAP}    ${NAME}
        ${HAS_SELECTOR}=    Run Keyword And Return Status    Should Not Be Empty    ${VALUE}
        IF    ${HAS_SELECTOR}    Append To List    ${VALID_NAMES}    ${NAME}
    END
    RETURN    @{VALID_NAMES}

Get Locator Categories
    [Documentation]    Return supported locator categories from current page map.

    Ensure Locator Map Is Loaded
    @{ALL_KEYS}=    Get Dictionary Keys    ${LOC}
    @{CATEGORIES}=    Evaluate    []
    @{RESERVED}=    Evaluate    ['meta', 'page', 'root']
    FOR    ${KEY}    IN    @{ALL_KEYS}
        ${IS_RESERVED}=    Run Keyword And Return Status    List Should Contain Value    ${RESERVED}    ${KEY}
        IF    not ${IS_RESERVED}    Append To List    ${CATEGORIES}    ${KEY}
    END
    RETURN    @{CATEGORIES}

Get Current Page
    [Documentation]    Return currently loaded page alias value.

    RETURN    ${CURRENT_PAGE}

Get Locator File
    [Documentation]    Return currently loaded locator file path.

    RETURN    ${LOCATOR_FILE}
