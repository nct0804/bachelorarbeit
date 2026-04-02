*** Settings ***
Documentation       page interaction keywords.

Resource            common.resource


*** Keywords ***
Page Should Be Ready
    [Documentation]    Validate the specified page is opened.
    [Arguments]    ${PAGE}
    Validate Page Is Opened    ${PAGE}

Go To Page
    [Documentation]    Navigate to the specified page and validate it is opened.
    [Arguments]    ${PAGE}
    Navigate To Page    ${PAGE}
    Validate Page Is Opened    ${PAGE}

Normalize Theme Mode
    [Documentation]    Normalize theme aliases to canonical values: dark or light.
    [Arguments]    ${MODE}
    ${MODE_KEY}=    Convert To Lowercase    ${MODE}
    ${MODE_KEY}=    Strip String    ${MODE_KEY}
    ${MODE_KEY}=    Replace String    ${MODE_KEY}    mode    ${EMPTY}
    ${MODE_KEY}=    Strip String    ${MODE_KEY}
    Should Match Regexp    ${MODE_KEY}    ^(dark|light)$
    RETURN    ${MODE_KEY}

Get Current Page Theme
    [Documentation]    Return current page theme directly from html classList.
    Wait For Elements State    css=html    visible    timeout=3s
    ${THEME}=    Evaluate JavaScript
    ...    css=html
    ...    (element) => (element && element.classList.contains('dark')) ? 'dark' : 'light'
    RETURN    ${THEME}

Try Click Theme Toggle
    [Documentation]    Try clicking a theme toggle quickly without long generic waits.
    [Arguments]    ${BUTTON_NAME}
    ${TOGGLE_SELECTOR}=    Get Locator In Category    button    ${BUTTON_NAME}

    ${VISIBLE}=    Run Keyword And Return Status
    ...    Wait For Elements State    css=${TOGGLE_SELECTOR}    visible    timeout=800ms
    IF    ${VISIBLE}
        Click    css=${TOGGLE_SELECTOR}
        RETURN    ${TRUE}
    END

    ${ATTACHED}=    Run Keyword And Return Status
    ...    Wait For Elements State    css=${TOGGLE_SELECTOR}    attached    timeout=800ms
    IF    ${ATTACHED}
        Click    css=${TOGGLE_SELECTOR}    force=True
        RETURN    ${TRUE}
    END

    RETURN    ${FALSE}

Set Page Theme To Desired Choice
    [Documentation]    Set page theme to desired state with a simple primary/secondary toggle click.
    [Arguments]    ${DESIRED_MODE}
    ${MODE_KEY}=    Normalize Theme Mode    ${DESIRED_MODE}
    ${CURRENT_MODE}=    Get Current Page Theme

    IF    '${CURRENT_MODE}' == '${MODE_KEY}'
        Log    Theme already ${MODE_KEY}; no toggle click needed.
        RETURN
    END

    IF    '${MODE_KEY}' == 'dark'
        ${TOGGLE_BUTTON}=    Set Variable    Dark Mode Toggle
        ${ALT_TOGGLE_BUTTON}=    Set Variable    Light Mode Toggle
    ELSE
        ${TOGGLE_BUTTON}=    Set Variable    Light Mode Toggle
        ${ALT_TOGGLE_BUTTON}=    Set Variable    Dark Mode Toggle
    END

    ${TOGGLED}=    Try Click Theme Toggle    ${TOGGLE_BUTTON}
    IF    not ${TOGGLED}
        ${TOGGLED}=    Try Click Theme Toggle    ${ALT_TOGGLE_BUTTON}
    END
    Should Be True    ${TOGGLED}

    ${FINAL_MODE}=    Get Current Page Theme
    Should Be Equal As Strings    ${FINAL_MODE}    ${MODE_KEY}

Page Theme Should Be Desired Mode
    [Documentation]    Gherkin wrapper for idempotent theme switching.
    [Arguments]    ${DESIRED_MODE}
    Set Page Theme To Desired Choice    ${DESIRED_MODE}
