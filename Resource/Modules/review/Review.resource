*** Settings ***
Documentation       Review module keywords.

Resource            ../../Common/__lib.resource


*** Keywords ***
Go To Review Page
    [Documentation]    Navigate to the Review page and validate it is opened.

    Navigate To Page    Review
    Validate Page Is Opened    Review

Review Page Should Be Ready
    [Documentation]    Validate the Review page is opened.

    Validate Page Is Opened    Review

Rate Review As
    [Documentation]    Submit a review rating by label.
    [Arguments]    ${RATING}

    ${RATING_KEY}=    Normalize Page Name    ${RATING}
    IF    '${RATING_KEY}' == 'hard'
        Click Button    Hard
        RETURN
    END
    IF    '${RATING_KEY}' == 'good'
        Click Button    Good
        RETURN
    END
    Fail    Unsupported review rating: ${RATING}

Rate Review If Available
    [Documentation]    Attempt to submit a review rating if the button is visible.
    [Arguments]    ${RATING}

    ${RATING_KEY}=    Normalize Page Name    ${RATING}
    IF    '${RATING_KEY}' == 'hard'
        ${BUTTON_NAME}=    Set Variable    Hard
    ELSE IF    '${RATING_KEY}' == 'good'
        ${BUTTON_NAME}=    Set Variable    Good
    ELSE
        Fail    Unsupported review rating: ${RATING}
    END
    ${IS_VISIBLE}=    Run Keyword And Return Status
    ...    Wait For Category Element State
    ...    button
    ...    ${BUTTON_NAME}
    ...    visible
    ...    3s
    IF    ${IS_VISIBLE}
        Click Button    ${BUTTON_NAME}
        RETURN
    END
    Log    Review rating button not available: ${BUTTON_NAME}
