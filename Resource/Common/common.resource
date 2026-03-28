*** Settings ***
Documentation       Common Browser and page navigation keywords.

Library             Collections
Library             String
Library             Browser
Resource            ../MainLib.resource


*** Variables ***
${SERVER}           localhost:4242
${BASE_URL}         http://${SERVER}
${HEADLESS}         False
&{PAGE_ROUTES}      welcomepage=/    welcome page=/    landing=/    landing page=/
...                 login=/login    log in=/login    signin=/login    sign in=/login
...                 sign up=/register    signup=/register    register=/register
...                 main page=/home    main learning page=/home    main layout=/home
...                 main=/home    mainpage=/home    home=/home
...                 challenge=/challenge    challenge page=/challenge
...                 ranking=/ranking    leaderboard=/ranking
...                 profile=/profile    user profile=/profile
...                 pronunciation=/pronunciation    sounds=/pronunciation
...                 speak=/speak    speaking=/speak
...                 review=/review    review page=/review
...                 inbox=/inbox    notifications=/inbox
...                 achievements=/achievements    badges=/achievements
...                 about us=/aboutus    about=/aboutus    about page=/aboutus
...                 learn=/learn    learning=/learn


*** Keywords ***
Resolve Page Route
    [Documentation]    Resolve a page route path from the PAGE_ROUTES mapping using normalized page name.
    [Tags]    technical
    [Arguments]    ${PAGE}
    ${PAGE_KEY}=    Normalize Page Name    ${PAGE}
    ${HAS_ROUTE}=    Run Keyword And Return Status    Dictionary Should Contain Key    ${PAGE_ROUTES}    ${PAGE_KEY}
    IF    not ${HAS_ROUTE}    Fail    No route mapping found for page: ${PAGE}
    ${ROUTE}=    Get From Dictionary    ${PAGE_ROUTES}    ${PAGE_KEY}
    RETURN    ${ROUTE}

Open Browser Session
    [Documentation]    Open browser session and navigate to base URL.
    [Tags]    technical
    [Arguments]    ${BROWSER}=firefox
    ${HEADLESS_BOOL}=    Evaluate    str($HEADLESS).lower() in ['true', '1', 'yes']

    New Browser    ${BROWSER}    headless=${HEADLESS_BOOL}    args=["--start-maximized"]
    New Context    viewport=None
    New Page    ${BASE_URL}/
    Wait For Load State    domcontentloaded
    Load Locators    Welcome Page
    Validate Current Page Root

Close Browser Session
    [Documentation]    Close active browser session if one exists.

    Run Keyword And Ignore Error    Close Browser

Go To Relative Path
    [Documentation]    Navigate to an application route relative to base URL.
    [Tags]    technical
    [Arguments]    ${PATH}
    Go To    ${BASE_URL}${PATH}
    Wait For Load State    networkidle    timeout=20s

Navigate To Page
    [Documentation]    Navigate to a page by alias and load matching locator map.
    [Arguments]    ${PAGE}
    ${PATH}=    Resolve Page Route    ${PAGE}
    Go To Relative Path    ${PATH}
    Load Locators    ${PAGE}
    Validate Current Page Root

Validate Current Page Root
    [Documentation]    Validate loaded page root locator is visible.
    [Tags]    technical
    ${ROOT}=    Get Locator    root
    Wait For Elements State    css=${ROOT}    visible    timeout=20s

Validate Page Is Opened
    [Documentation]    Load locators for page alias and validate root visibility.
    [Arguments]    ${PAGE}
    Load Locators    ${PAGE}
    Wait For Load State    domcontentloaded
    Validate Current Page Root

Wait For Category Element State
    [Documentation]    Wait for a locator category element to reach target state.
    [Tags]    technical
    [Arguments]    ${CATEGORY}    ${NAME}    ${STATE}=visible    ${TIMEOUT}=15s
    ${SELECTOR}=    Get Locator In Category    ${CATEGORY}    ${NAME}
    ${STATE_KEY}=    Convert To Lowercase    ${STATE}
    ${COUNT}=    Get Element Count    css=${SELECTOR}
    ${IS_ABSENT_OK}=    Evaluate    $STATE_KEY in ['hidden', 'detached']
    ${IS_ABSENT}=    Evaluate    int($COUNT) == 0
    IF    ${IS_ABSENT_OK} and ${IS_ABSENT}    RETURN
    Wait For Elements State    css=${SELECTOR} >> nth=0    ${STATE}    timeout=${TIMEOUT}

Category Element Should Be Visible
    [Documentation]    Assert a category element is visible on the page.
    [Tags]    technical
    [Arguments]    ${CATEGORY}    ${NAME}
    Wait For Category Element State    ${CATEGORY}    ${NAME}    visible

Category Element Should Not Be Visible
    [Documentation]    Assert a category element is hidden on the page.
    [Tags]    technical
    [Arguments]    ${CATEGORY}    ${NAME}
    Wait For Category Element State    ${CATEGORY}    ${NAME}    hidden

Click Category Element
    [Documentation]    Click a locator category element by name.
    [Tags]    technical
    [Arguments]    ${CATEGORY}    ${NAME}
    ${SELECTOR}=    Get Locator In Category    ${CATEGORY}    ${NAME}
    Wait For Elements State    css=${SELECTOR}    visible    timeout=15s
    Click    css=${SELECTOR}

Click Category Element At Index
    [Documentation]    Click indexed element. Supports both {index} placeholder and nth-based selection.
    [Tags]    technical
    [Arguments]    ${CATEGORY}    ${NAME}    ${INDEX}=1
    ${SELECTOR}=    Get Locator In Category    ${CATEGORY}    ${NAME}

    # Check if selector contains {index} placeholder
    ${HAS_PLACEHOLDER}=    Run Keyword And Return Status    Should Contain    ${SELECTOR}    {index}

    IF    ${HAS_PLACEHOLDER}
        # Replace {index} placeholder with actual index value
        ${SELECTOR}=    Replace String    ${SELECTOR}    {index}    ${INDEX}
        Log    Replaced {index} placeholder: ${SELECTOR}
        Wait For Elements State    css=${SELECTOR}    visible    timeout=15s
        Click    css=${SELECTOR}
    ELSE
        # Use nth-based selection for standard selectors
        Wait For Elements State    css=${SELECTOR}    visible    timeout=15s
        Click    css=${SELECTOR} >> nth=${INDEX}
    END

Fill Category Element
    [Documentation]    Fill text into a category element by name.
    [Tags]    technical
    [Arguments]    ${CATEGORY}    ${NAME}    ${VALUE}
    ${SELECTOR}=    Get Locator In Category    ${CATEGORY}    ${NAME}
    Wait For Elements State    css=${SELECTOR}    visible    timeout=15s
    Fill Text    css=${SELECTOR}    ${VALUE}

Get Category Element Count
    [Documentation]    Return the number of matched elements for a locator entry.
    [Tags]    technical
    [Arguments]    ${CATEGORY}    ${NAME}
    ${SELECTOR}=    Get Locator In Category    ${CATEGORY}    ${NAME}
    ${COUNT}=    Get Element Count    css=${SELECTOR}
    RETURN    ${COUNT}

Get Category Element Text
    [Documentation]    Return the text value of a category element.
    [Tags]    technical
    [Arguments]    ${CATEGORY}    ${NAME}
    ${SELECTOR}=    Get Locator In Category    ${CATEGORY}    ${NAME}
    Wait For Elements State    css=${SELECTOR} >> nth=0    visible    timeout=15s
    ${TEXT}=    Get Text    css=${SELECTOR} >> nth=0
    RETURN    ${TEXT}

Category Element Text Should Contain
    [Documentation]    Assert a category element text contains expected content.
    [Tags]    technical
    [Arguments]    ${CATEGORY}    ${NAME}    ${EXPECTED_TEXT}
    ${TEXT}=    Get Category Element Text    ${CATEGORY}    ${NAME}
    Should Contain    ${TEXT}    ${EXPECTED_TEXT}

Validate Category Elements If Present
    [Documentation]    Validate category locators are visible when present in the locator map.
    [Tags]    technical
    [Arguments]    ${CATEGORY}    @{NAMES}
    FOR    ${NAME}    IN    @{NAMES}
        ${HAS_LOCATOR}=    Locator Exists    ${CATEGORY}.${NAME}
        IF    ${HAS_LOCATOR}
            Category Element Should Be Visible    ${CATEGORY}    ${NAME}
        END
    END

Validate Current Page Categories
    [Documentation]    Validate that non-empty locators in selected categories are visible.
    [Arguments]    @{CATEGORIES}

    ${HAS_INPUT}=    Evaluate    len($CATEGORIES) > 0
    IF    not ${HAS_INPUT}
        @{CATEGORIES}=    Get Locator Categories
    END
    FOR    ${CATEGORY}    IN    @{CATEGORIES}
        @{NAMES}=    Get Locator Names In Category    ${CATEGORY}
        FOR    ${NAME}    IN    @{NAMES}
            Wait For Category Element State    ${CATEGORY}    ${NAME}    visible    10s
        END
    END

Scroll Into Element
    [Documentation]    Scroll to a category element by name.
    [Arguments]    ${NAME}
    ${SELECTOR}=    Get Locator In Category    section    ${NAME}
    Wait For Elements State    css=${SELECTOR} >> nth=0    visible    timeout=15s
    Scroll To Element    css=${SELECTOR} >> nth=0

Wait for Second
    [Documentation]    Wait for a specified number of seconds.
    [Arguments]    ${SECONDS}
    Sleep    ${SECONDS}s
