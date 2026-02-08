# DEMO USER JOURNEY

The Postman json file " GermanGains Complete API " contains a folder called " Demo User Journey ", this shows the entire user flow from login to course selection to completing exercises

The test scripts validate that database seed is working correctly by checking for specific details like having 5 lessons in the first module and getting XP points after answering correctly , earning streaks,...

# Features - Learning Path

Starts with user at level 1 with 0 XP, this collection or this course structure is mainly for MVP and its not completed yet:
1. This focused on A1.1 as the main course (unlocked), A1.2, A2.1, and A2.2 added as locked courses to show progression which will be empty.
2. There will be 2 Modules (aka. Units) within course A1.1:
    -   First module (unlocked) with 5 lessons
    -   Second module (locked) with 5 placeholder lessons (this is also empty to show progression)
    -   Prerequisite relationship between modules (which means the second module only be activated, when the first module is completed)
3.  In each Modules, there will be in total 5 Lessons which indicate as cirle points exactly like duolingo:
    -   First lesson is unlocked and contains 5 exercises
    -   Other 4 lessons are ready but "locked" (require XP to unlock)
4.  Exercise Variety (some option has imageSrc but is set as optinal)
    -   Multiple choice questions
    -   Luckentext
    -   Vocabulary check exercises
5.  Pronunciation Feature (a special separated tab)
    -   Three sound groups: Vowels, Umlauts, and Special Consonants
    -   10 German sounds with example words and audio paths (audio paths are missing)

# Freely adjust as needed (seed.ts)
- Feel free to modify the seed.ts file as needed. You can restructure its logic or implement custom designs based on your specific requirements and creativity.