*** Settings ***
Documentation    Generated feature tests from RAG Pipeline.
Resource    ./generated_achievements.resource

*** Test Cases ***
Test Case 1: achievements_validation::User accesses their achievements and sees their unlocked badges
    [Documentation]    Given the user navigates to the "Sign In" page
    ...    When the user signs in with email "chithien.nguyen@germangains.com" and password "password123"
    ...    Then the "Main Page" page should be opened
    ...    When the user is on the "main" page
    ...    And the user clicks the "Achievements" button right sidebar
    ...    Then the "Achievements" page should be opened
    ...    And the "Your Badges" section should be visible
    [Setup]    Open Browser Session
    01_01: AI Generative Step
    01_02: AI Generative Step
    01_03: AI Generative Step
    01_04: AI Generative Step
    01_05: AI Generative Step
    01_06: AI Generative Step
    01_07: AI Generative Step
    [Teardown]    Close Browser Session

