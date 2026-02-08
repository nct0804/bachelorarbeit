*** Settings ***
Documentation       Common Resource File

Resource            ../MainLib.resource

*** Variables ***
${HEADLESS}    False


*** Keywords ***
Open Browser
    [Documentation]    Open the browser and the website
    [Tags]    basic
    New Browser    chromium    headless=${HEADLESS}
    New Context
    New Page    http://localhost:4242/

the user open the browser
    [Documentation]    Open the browser and the website
    [Tags]    gherkin
    Open Browser
