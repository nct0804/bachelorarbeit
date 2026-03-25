*** Settings ***
Documentation       Checkbox interaction keywords.

Resource            common.resource


*** Keywords ***
Set Checkbox To State
    [Documentation]    Set checkbox to target state (checked/unchecked). Only clicks if state needs to change.
    [Arguments]    ${NAME}    ${STATE}

    ${SELECTOR}=    Get Locator In Category    checkbox    ${NAME}

    # Get current state from aria-checked attribute
    ${ARIA_CHECKED}=    Get Attribute    css=${SELECTOR}    aria-checked
    ${IS_CHECKED}=    Evaluate    '${ARIA_CHECKED}' == 'true'

    # Normalize state and determine target
    ${STATE_NORMALIZED}=    Convert To Lower Case    ${STATE}
    ${TARGET_CHECKED}=    Evaluate    '${STATE_NORMALIZED}' in ['checked', 'check', 'true', 'on']

    # Compare current state with target state and take action
    IF    ${TARGET_CHECKED} and not ${IS_CHECKED}
        Log    Checkbox '${NAME}' is unchecked, clicking to set to checked state
        Click    css=${SELECTOR}
    ELSE IF    not ${TARGET_CHECKED} and ${IS_CHECKED}
        Log    Checkbox '${NAME}' is checked, clicking to set to unchecked state
        Click    css=${SELECTOR}
    ELSE IF    ${TARGET_CHECKED} and ${IS_CHECKED}
        Log    Checkbox '${NAME}' is already checked, no action needed
    ELSE
        Log    Checkbox '${NAME}' is already unchecked, no action needed
    END

Checkbox Should Be Visible
    [Documentation]    Assert that a checkbox locator is visible.
    [Arguments]    ${NAME}
    Category Element Should Be Visible    checkbox    ${NAME}

Click Checkbox
    [Documentation]    Click a checkbox locator by logical name.
    [Arguments]    ${NAME}
    Click Category Element    checkbox    ${NAME}

Verify If The Checkbox Status Is State
    [Documentation]    Check the checkbox if it is in the target state (checked/unchecked).
    [Arguments]    ${NAME}    ${TARGET_STATE}
    ${SELECTOR}=    Get Locator In Category    checkbox    ${NAME}

    # Get current state from aria-checked attribute
    ${ARIA_CHECKED}=    Get Attribute    css=${SELECTOR}    aria-checked
    ${ACTUAL_STATE}=    Evaluate    '${ARIA_CHECKED}' == 'true'

    ${EXPECTED_NORMALIZED}=    Convert To Lower Case    ${TARGET_STATE}
    ${EXPECTED_BOOL}=    Evaluate    '${EXPECTED_NORMALIZED}' in ['checked', 'check', 'true', 'on']

    # Compare current state with expected state and take action if needed
    IF    ${EXPECTED_BOOL} and not ${ACTUAL_STATE}
        Log    Checkbox '${NAME}' is unchecked but should be checked, clicking to correct
        Click    css=${SELECTOR}
    ELSE IF    not ${EXPECTED_BOOL} and ${ACTUAL_STATE}
        Log    Checkbox '${NAME}' is checked but should be unchecked, clicking to correct
        Click    css=${SELECTOR}
    ELSE IF    ${EXPECTED_BOOL} and ${ACTUAL_STATE}
        Log    Checkbox '${NAME}' is already in expected state: checked
    ELSE
        Log    Checkbox '${NAME}' is already in expected state: unchecked
    END

Checkbox State Should Be
    [Documentation]    Assert checkbox state equals expected value (checked/unchecked).
    [Arguments]    ${NAME}    ${EXPECTED_STATE}

    ${SELECTOR}=    Get Locator In Category    checkbox    ${NAME}
    ${ARIA_CHECKED}=    Get Attribute    css=${SELECTOR}    aria-checked
    ${IS_CHECKED}=    Evaluate    '${ARIA_CHECKED}' == 'true'

    ${EXPECTED_NORMALIZED}=    Convert To Lower Case    ${EXPECTED_STATE}
    ${EXPECTED_BOOL}=    Evaluate    '${EXPECTED_NORMALIZED}' in ['checked', 'check', 'true', 'on']

    Should Be Equal    ${IS_CHECKED}    ${EXPECTED_BOOL}
