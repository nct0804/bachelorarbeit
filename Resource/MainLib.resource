*** Settings ***
Documentation       Main Robot Framework resource entrypoint.

Library             Collections
Library             OperatingSystem
Library             String
Library             Browser
Resource            Common/__lib.resource
Resource            Modules/welcomepage/__lib.resource
Resource            Modules/login/__lib.resource
Resource            Modules/register/__lib.resource
Resource            Modules/mainpage/__lib.resource
Resource            Modules/challenge/__lib.resource
Resource            Modules/learn/__lib.resource
Resource            Modules/inbox/__lib.resource
Resource            Modules/aboutus/__lib.resource
Resource            Modules/achievements/__lib.resource
Resource            Modules/pronunciation/__lib.resource
Resource            Modules/ranking/__lib.resource
Resource            Modules/speak/__lib.resource
Resource            Modules/review/__lib.resource
Resource            Modules/profile/__lib.resource
