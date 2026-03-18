*** Settings ***
Documentation       Profile module keywords.

Resource            ../../Common/__lib.resource


*** Keywords ***
Profile Page Validation
    [Documentation]    Validate profile panels are visible.

    Validate Page 'Profile' Is Opened
    Validate Category Elements If Present    list
    ...    Header Card
    ...    Stats
    ...    Activity
    ...    Achievements
    ...    Favorites

Profile Stats Should Be Visible
    [Documentation]    Validate profile stat cards are visible.

    Validate Page 'Profile' Is Opened
    Validate Category Elements If Present    list    Stat Xp    Stat Streak    Stat Level

Profile '${MESSAGE}' Should Be Visible
    [Documentation]    Assert profile loading message is visible.

    Messagebox '${MESSAGE}' Should Be Visible
