*** Settings ***
Documentation       Main page module keywords.

Resource            ../../Common/__lib.resource


*** Keywords ***
Main Page Validation
    [Documentation]    Validate core main layout panels are visible.

    Validate Page 'Main Page' Is Opened
    Validate Category Elements If Present    list    Nav    Topbar    Rightbar
    Validate Category Elements If Present    list    Quote    Progress

Open Main Menu
    [Documentation]    Open the main menu panel if available.

    Click Button 'Menu Toggle'
    Validate Category Elements If Present    list    More Panel

Close Main Menu
    [Documentation]    Close the main menu panel if it is open.
    ${check}=    Run Keyword And Return    Validate Category Elements If Present    list    More Panel
    IF    ${check}    Click Button 'Menu Toggle'

Open '${PAGE}' From Main Menu
    [Documentation]    Open the specified page from the main menu.

    Open Main Menu
    Click Button '${PAGE}'
    Validate Page '${PAGE}' Is Opened

Cancel Logout From Main Menu
    [Documentation]    Open the logout modal and cancel the action.

    Open Main Menu
    Click Button 'Logout'
    ${HAS_MESSAGE}=    Locator Exists    messagebox.Logout Message
    IF    ${HAS_MESSAGE}    Messagebox 'Logout Message' Should Be Visible
    ${HAS_CONTINUE}=    Locator Exists    button.Continue
    IF    ${HAS_CONTINUE}    Click Button 'Continue'
    Validate Page 'Main Page' Is Opened

Confirm Logout From Main Menu
    [Documentation]    Open the logout modal and confirm logout.

    Open Main Menu
    Click Button 'Logout'
    ${HAS_CONFIRM}=    Locator Exists    button.Logout Confirm
    IF    ${HAS_CONFIRM}    Click Button 'Logout Confirm'
    ${HAS_CONTINUE}=    Locator Exists    button.Continue
    IF    ${HAS_CONTINUE}    Click Button 'Continue'

Refresh Main Quote
    [Documentation]    Refresh the daily quote from the top bar.

    Click Button 'Refresh Quote'

Start Lesson From Main Page
    [Documentation]    Start the next lesson from the right bar.

    Click Button 'Learn'
    Validate Page 'Learn' Is Opened

Start Challenge From Main Page
    [Documentation]    Start the challenge from the right bar.

    Click Button 'Start Challenge'
    Validate Page 'Challenge' Is Opened

Set Daily Goal Target
    [Documentation]    Set the daily goal target value from the main page.
    [Arguments]    ${VALUE}

    Click Button 'Edit'
    Fill Textbox 'Daily Goal Target' with Value '${VALUE}'
    Click Button 'Save Goal'

Advance Quick Practice
    [Documentation]    Advance to the next quick practice prompt.

    Click Button 'Quick Practice Next'

Reset Quick Practice
    [Documentation]    Reset the quick practice widget.

    Click Button 'Quick Practice Reset'

Select Quick Practice Option At Index
    [Documentation]    Select a quick practice option by index.
    [Arguments]    ${INDEX}=1

    Click Button 'Quick Practice Option' At Index '${INDEX}'

Enable Dark Mode
    [Documentation]    Toggle dark mode from the top bar.
    Click Button 'Dark Mode Toggle'
