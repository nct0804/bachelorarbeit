*** Settings ***
Documentation       Main Entrance Library Resource

Library             Browser
Library             SeleniumLibrary
Resource            Modules/Homepage/Homepage.resource
Resource            Modules/Signin/Signin.resource
Resource            Modules/Signup/Signup.resource
Resource            Common/__lib.resource