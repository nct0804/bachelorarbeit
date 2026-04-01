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

Section Item Count
    [Documentation]    Assert a section contains an exact number of child items.
    [Arguments]    ${NAME}    ${ITEM_SELECTOR}=AUTO    ${EXPECTED_COUNT}=0

    ${SECTION_SELECTOR}=    Get Locator In Category    section    ${NAME}
    ${ITEM_SELECTOR}=    Resolve Section Item Selector    ${NAME}    ${ITEM_SELECTOR}
    ${ITEM_COUNT}=    Get Element Count    css=${SECTION_SELECTOR} >> css=${ITEM_SELECTOR}
    Should Be Equal As Integers    ${ITEM_COUNT}    ${EXPECTED_COUNT}

Resolve Section Item Selector
    [Documentation]    Resolve effective item selector for a section.
    [Arguments]    ${NAME}    ${ITEM_SELECTOR}=AUTO

    ${NAME_KEY}=    Convert To Lowercase    ${NAME}
    ${NAME_KEY}=    Strip String    ${NAME_KEY}
    ${SELECTOR_KEY}=    Convert To Uppercase    ${ITEM_SELECTOR}
    ${SELECTOR_KEY}=    Strip String    ${SELECTOR_KEY}

    IF    '${SELECTOR_KEY}' != 'AUTO'    RETURN    ${ITEM_SELECTOR}

    # Achievements section has static heading text; count only badge cards in grid.
    IF    '${NAME_KEY}' == 'your badges'    RETURN    div.grid > div

    RETURN    *

Section Should Be Empty
    [Documentation]    Assert that a section has no child items.
    [Arguments]    ${NAME}
    Section Item Count    ${NAME}    AUTO    0

Validate Section Is In View
    [Documentation]    Assert that the section is currently inside the viewport.
    [Arguments]    ${NAME}
    ${SELECTOR}=    Get Locator In Category    section    ${NAME}
    Wait For Elements State    css=${SELECTOR} >> nth=0    visible    timeout=15s
    ${IN_VIEW}=    Evaluate JavaScript
    ...    css=${SELECTOR} >> nth=0
    ...    (el)=>{const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0}
    Should Be True    ${IN_VIEW}
