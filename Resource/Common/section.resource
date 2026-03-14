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
