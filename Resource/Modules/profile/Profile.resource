*** Settings ***
Documentation       Profile module keywords.

Resource            ../../Common/__lib.resource


*** Keywords ***
Go To Profile Page
    [Documentation]    Navigate to the Profile page and validate it is opened.

    Navigate To Page    Profile
    Validate Page Is Opened    Profile

Profile Page Should Be Ready
    [Documentation]    Validate profile panels are visible.

    Validate Page Is Opened    Profile
    Validate Category Elements If Present    list
    ...    Header Card
    ...    Stats
    ...    Activity
    ...    Achievements
    ...    Favorites

Profile Stats Should Be Visible
    [Documentation]    Validate profile stat cards are visible.

    Validate Page Is Opened    Profile
    Validate Category Elements If Present    list    Stat Xp    Stat Streak    Stat Level

Retry Profile Load
    [Documentation]    Retry loading the profile data.

    Click Button    Retry

Profile Loading Should Be Visible
    [Documentation]    Assert profile loading message is visible.

    Messagebox Should Be Visible    Loading

Profile Error Should Be Visible
    [Documentation]    Assert profile error message is visible.

    Messagebox Should Be Visible    Error

Profile Empty State Should Be Visible
    [Documentation]    Assert profile empty state message is visible.

    Messagebox Should Be Visible    Empty
