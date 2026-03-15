*** Settings ***
Documentation       Library resource for Home Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
Go To Welcome Page
    [Documentation]    Navigate to the Welcome Page and validate it is opened.

    Navigate To Page    Welcome Page
    Validate Page Is Opened    Welcome Page

Welcome Page Should Be Ready
    [Documentation]    Validate core welcome page sections are visible.

    Validate Page Is Opened    Welcome Page
    Validate Category Elements If Present    section
    ...    Hero
    ...    Features
    ...    Reviews
    ...    About
    ...    Benefits
    ...    Course Features
    ...    About Us
    ...    What Our Students Say

Open Sign In From Welcome Page
    [Documentation]    Open the sign-in page from the welcome page CTA.

    Validate Page Is Opened    Welcome Page
    Click Button    Sign In
    Validate Page Is Opened    Sign In

Start Learning From Welcome Page
    [Documentation]    Start learning from the hero CTA and land on sign-in.

    Validate Page Is Opened    Welcome Page
    Click Button    Start Learning Now
    Validate Page Is Opened    Sign In

Open Welcome Page Section From Navigation
    [Documentation]    Use welcome page navigation to reach a section.
    [Arguments]    ${SECTION}

    Validate Page Is Opened    Welcome Page
    Click Button    ${SECTION}
    Section Should Be Visible    ${SECTION}

Scroll To Welcome Page Section
    [Documentation]    Scroll to a welcome page section by name.
    [Arguments]    ${SECTION}

    Validate Page Is Opened    Welcome Page
    Scroll To Section    ${SECTION}
