*** Settings ***
Documentation       Common Resource File

Resource            ../MainLib.resource


*** Keywords ***
Open Browser
    [Documentation]    Open the browser and the website
    [Tags]    basic
    New Browser    chromium    headless=False
    New Context
    New Page    http://localhost:4242/

the user open the browser
    [Documentation]    Open the browser and the website
    [Tags]    gherkin
    Open Browser
