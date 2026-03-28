*** Settings ***
Documentation       Section interaction keywords.

Resource            common.resource


*** Keywords ***
Section Should Be Visible
    [Documentation]    Assert that a section locator is visible.
    [Arguments]    ${NAME}
    Category Element Should Be Visible    section    ${NAME}

Section Should Contain Text
    [Documentation]    Assert that a section locator contains expected text.
    [Arguments]    ${NAME}    ${EXPECTED_TEXT}

    Category Element Text Should Contain    section    ${NAME}    ${EXPECTED_TEXT}

Scroll To Section
    [Documentation]    Scroll to a section locator by name.
    [Arguments]    ${NAME}
    Scroll Into Element    ${NAME}

The section should be updated with a new value
    [Documentation]    Assert that a section value changes after clicking its refresh/reset button.
    [Arguments]    ${SECTION}    ${BUTTON_NAME}=New Quote
    ${old_value}=    Get Category Element Text    section    ${SECTION}
    Scroll To Section    ${SECTION}
    Wait Until Keyword Succeeds    5 times    2 seconds
    ...    Section Value Should Change After Clicking Button    ${SECTION}    ${BUTTON_NAME}    ${old_value}

Section Value Should Change After Clicking Button
    [Documentation]    Click a button and verify the section text changed from its previous value.
    [Arguments]    ${SECTION}    ${BUTTON_NAME}    ${old_value}
    Click Category Element    button    ${BUTTON_NAME}
    ${new_value}=    Get Category Element Text    section    ${SECTION}
    Should Not Be Equal As Strings    ${old_value}    ${new_value}

The section should be updated after clicking the button
    [Documentation]    Gherkin wrapper for asserting a section updates after clicking any button.
    [Arguments]    ${SECTION}    ${BUTTON_NAME}
    The section should be updated with a new value    ${SECTION}    ${BUTTON_NAME}

Section Item Count Should Be At Least Items
    [Documentation]    Assert that list locator has at least expected item count.
    [Arguments]    ${NAME}    ${MIN_COUNT}=1

    ${COUNT}=    Get Category Element Count    section    ${NAME}
    ${COUNT_OK}=    Evaluate    int($COUNT) >= int($MIN_COUNT)
    Should Be True    ${COUNT_OK}
