*** Settings ***
Documentation       Library resource for Home Page

Library             Browser
Resource            ../../MainLib.resource


*** Keywords ***
Go To Welcome Page
    [Documentation]    Navigate to the Welcome Page and validate it is opened.

    Navigate To Page 'Welcome Page'
    Validate Page 'Welcome Page' Is Opened

Welcome Page Should Be Ready
    [Documentation]    Validate core welcome page sections are visible.

    Validate Page 'Welcome Page' Is Opened
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

    Validate Page 'Welcome Page' Is Opened
    Click Button 'Sign In'
    Validate Page 'Sign In' Is Opened

Start Learning From Welcome Page
    [Documentation]    Start learning from the hero CTA and land on sign-in.

    Validate Page 'Welcome Page' Is Opened
    Click Button 'Start Learning Now'
    Validate Page 'Sign In' Is Opened

Open Welcome Page Section From Navigation
    [Documentation]    Use welcome page navigation to reach a section.
    [Arguments]    ${SECTION}

    Validate Page 'Welcome Page' Is Opened
    Click Button '${SECTION}'
    Section '${SECTION}' Should Be Visible

Scroll To Welcome Page Section
    [Documentation]    Scroll to a welcome page section by name.
    [Arguments]    ${SECTION}

    Validate Page 'Welcome Page' Is Opened
    Scroll To Section '${SECTION}'
