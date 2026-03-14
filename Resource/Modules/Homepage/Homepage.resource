*** Settings ***
Documentation       Library resource for Home Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
Go To Homepage
    [Documentation]    Navigate to the homepage and validate it is opened.

    Navigate To Page    Homepage
    Validate Page Is Opened    Homepage

Homepage Should Be Ready
    [Documentation]    Validate core homepage sections are visible.

    Validate Page Is Opened    Homepage
    Validate Category Elements If Present    section
    ...    Hero
    ...    Features
    ...    Reviews
    ...    About
    ...    Benefits
    ...    Course Features
    ...    About Us
    ...    What Our Students Say

Open Sign In From Homepage
    [Documentation]    Open the sign-in page from the homepage CTA.

    Validate Page Is Opened    Homepage
    Click Button    Sign In
    Validate Page Is Opened    Sign In

Start Learning From Homepage
    [Documentation]    Start learning from the hero CTA and land on sign-in.

    Validate Page Is Opened    Homepage
    Click Button    Start Learning Now
    Validate Page Is Opened    Sign In

Open Homepage Section From Navigation
    [Documentation]    Use homepage navigation to reach a section.
    [Arguments]    ${SECTION}

    Validate Page Is Opened    Homepage
    Click Button    ${SECTION}
    Section Should Be Visible    ${SECTION}

Scroll To Homepage Section
    [Documentation]    Scroll to a homepage section by name.
    [Arguments]    ${SECTION}

    Validate Page Is Opened    Homepage
    Scroll To Section    ${SECTION}
