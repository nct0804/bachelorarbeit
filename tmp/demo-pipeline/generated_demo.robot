*** Settings ***
Documentation    Generated feature tests from RAG Pipeline.
Resource    ./generated_demo.resource

*** Test Cases ***
Test Case 1: Auto-Generated
    [Documentation]    As a tester, I want to open the sign in page from the welcome page, then back to the welcome page by clicking the logo, so that I can verify the navigation flow between these pages.
    [Setup]    Open Browser Session
    01_01: AI Generative Step
    01_02: AI Generative Step
    01_03: AI Generative Step
    01_04: AI Generative Step
    [Teardown]    Close Browser Session

