*** Settings ***
Documentation       page interaction keywords.

Resource            common.resource


*** Keywords ***
'${PAGE}' Page Should Be Ready
    [Documentation]    Validate the specified page is opened.

    Validate Page '${PAGE}' Is Opened

Go To '${PAGE}' Page
    [Documentation]    Navigate to the specified page and validate it is opened.

    Navigate To Page '${PAGE}'
    Validate Page '${PAGE}' Is Opened

Open '${PAGE}' From '${FROM_PAGE}' Page
    [Documentation]    From a specified page, navigate to another page and validate it is opened.

    Validate Page '${FROM_PAGE}' Is Opened
    Navigate To Page '${PAGE}'
    Validate Page '${PAGE}' Is Opened
