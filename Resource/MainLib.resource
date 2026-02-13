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
Resource            Common/__lib.resource
