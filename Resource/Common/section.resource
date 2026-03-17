*** Settings ***
Documentation       Section interaction keywords.

Resource            common.resource


*** Keywords ***
Section '${NAME}' Should Be Visible
    [Documentation]    Assert that a section locator is visible.

    Category Element Should Be Visible    section    ${NAME}

Section '${NAME}' Should Contain Text '${EXPECTED_TEXT}'
    [Documentation]    Assert that a section locator contains expected text.

    Category Element Text Should Contain    section    ${NAME}    ${EXPECTED_TEXT}

Scroll To Section '${NAME}'
    [Documentation]    Scroll to a section locator by name.

    Scroll Into Element '${NAME}'
