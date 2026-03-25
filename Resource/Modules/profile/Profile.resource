*** Settings ***
Documentation       Profile module keywords.

Resource            ../../Common/__lib.resource


*** Keywords ***
Profile Page Validation
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

Profile Message Should Be Visible
    [Documentation]    Assert profile loading message is visible.
    [Arguments]    ${MESSAGE}
    Messagebox Should Be Visible    ${MESSAGE}
