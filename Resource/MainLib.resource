*** Settings ***
Documentation       Main Entrance Library Resource

Library             Collections
Library             OperatingSystem
Library             String
Library             Browser
Library             SeleniumLibrary
Resource            Modules/Homepage/Homepage.resource
Resource            Modules/login/Signin.resource
Resource            Modules/register/Signup.resource
Resource            Modules/challenge/Challenge.resource
Resource            Modules/learn/Learn.resource
Resource            Modules/inbox/Inbox.resource
Resource            Modules/aboutus/AboutUs.resource
Resource            Modules/achievements/Achievements.resource
Resource            Modules/pronunciation/Pronunciation.resource
Resource            Modules/ranking/Ranking.resource
Resource            Modules/speak/Speak.resource
Resource            Modules/review/Review.resource
Resource            Modules/profile/Profile.resource
Resource            Common/button.resource
Resource            Common/textbox.resource
Resource            Common/__lib.resource
