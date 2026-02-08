
# GermanGains - German learning platform

**GermanGains** is a comprehensive, self-paced German language learning platform that combines structured educational content with engaging gamification elements. Designed for learners from beginner (A1.1) to intermediate (A2.2) levels, the platform offers an interactive approach to having fun learning German through progressive content unlocking and achievement-based motivation.

![Login Page](assets/navigation.png)

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Installing](#installing)
4. [API Documentaion](#api-documentation)
5. [Testing](#testing)
6. [Contributors](#contributors)

## Features

- **JWT Authentication**: Secure user authentication using JSON Web Tokens, ensuring only verified users can access protected resources.

### **Gamification Elements**

- **Levels Unlocking**: Content unlocks progressively as you learn previous lessons
- **XP/Hearts System**: Earn experience points for correct answers and level up as you progress. Every user has 5 hearts - lose hearts for wrong answers, regain them by practicing completed exercises
- **Streak Rewards**: Build learning streaks with multiplier bonuses with correct answers (5+ streak = 2x XP, 11+ streak = 3x XP)
- **Anti-Farming Protection**: XP and streaks only awarded for new exercise completions, encouraging genuine learning

###  **Diverse Exercise Contents**

- **Multiple Choice Questions**: Test vocabulary, grammar, and comprehension
- **Fill-in-the-Blank**: Practice German sentence structure and word formation
- **Interactive Learning**: Immediate feedback with detailed explanations

###  **Pronunciation Site**
- **German Sound Library**: Comprehensive collection of German vowels, umlauts, consonants, and diphthongs
- **Audio Examples**: Native pronunciation for each sound with example words
- **Phonetic Learning**: Organized sound groups for systematic pronunciation practice


## Tech Stack

- **Backend:** Express (Node.js)
- **Frontend:** React
- **Database:** Postgresql with Prisma ORM
- **DevOps:** Docker, GitLab CI/CD
- **Testing Framework**: (Updating...)
- **UI Library**: ShadCn, Tailwind CSS

## Installing

### Prerequisites

To run this project, you need to have the following software installed on your system:

- Node.js
- npm (Node Package Manager)

or

- Docker

You can download and install Node.js and npm from the [Node.js official site](https://nodejs.org/) and Docker by following the instructions on the Docker official site [Docker official site](https://www.docker.com/products/docker-desktop/) .

### Run app with Docker

1. Clone the git repository:

   ```
   git clone https://code.fbi.h-da.de/sttgleeee/fwe-lernplattform.git
   ```

2. Navigate to the project directory and build the Docker containers:
   `   docker compose up --build -d`
   The backend will be available at [http://localhost:3000](http://localhost:3000).  
   The frontend will be available at [http://localhost:4242](http://localhost:4242).

Ensure that the relevant ports are free on your system.

### Run app for local development

1. Clone the git repository:
   ```
   git clone https://code.fbi.h-da.de/sttgleeee/fwe-lernplattform.git
   ```
2. Make sure to create a .env file for both backend and frontend:

- **Backend**

  ```
  DATABASE_URL="postgresql://germangains:germangains@db:5432/germangainsdb?schema=public"

  # JWT
  JWT_SECRET="supersecretjwtkey"
  JWT_REFRESH_SECRET="anotherrefreshsecret"
  JWT_EXPIRES_IN="1h"
  JWT_REFRESH_EXPIRES_IN="7d"

  # Server
  PORT=3000
  NODE_ENV=development

  # JWT
  JWT_SECRET="supersecretjwtkey"
  JWT_REFRESH_SECRET="anotherrefreshsecret"
  JWT_EXPIRES_IN="1h"
  JWT_REFRESH_EXPIRES_IN="7d"

  # Server
  PORT=3000
  NODE_ENV=development

  #Clerk Configuration
  CLERK_SECRET_KEY=sk_test_aOjvDHzBHbrLoEW55Mpxseu5GnzYfNRtMvxQgfZgm0
  CLERK_PUBLISHABLE_KEY=pk_test_aW1tdW5lLWhlcm9uLTMwLmNsZXJrLmFjY291bnRzLmRldiQ

  # OAuth Configuration
  GOOGLE_CLIENT_ID=1094186197186-lnngf921sj9q3jqf5r955tjkuhml98k7.apps.googleusercontent.com
  FACEBOOK_APP_ID=24751034047816954
  ```

- **Frontend**

  ```
  VITE_API_PROXY_TARGET=http://backend:3000

  # Clerk Configuration
  VITE_CLERK_PUBLISHABLE_KEY=pk_test_aW1tdW5lLWhlcm9uLTMwLmNsZXJrLmFjY291bnRzLmRldiQ
  ```

3. Run either backend or frontend or the whole project:

-  Frontend

   ```
   "npm run start:frontend": "cd frontend && npm install && npm run dev"

   ```

-  Backend locally running command:
```
   CMD sh -c "echo \"Using database: $(echo $DATABASE_URL | sed 's/.*@.*\///' | sed 's/?.*$//')\" && \
            npx prisma generate && \
            npx prisma migrate deploy && \
            npx prisma db seed && \
            npm run dev"
```
### Docker trouble shooting

If it occurs either the following errors, make sure to clean your docker images by using `docker-compose prune -a`

```
    The database can't reach to db:5432

    Error: P1010: User was denied access on the database ⁠ (not available) ⁠
```

### Stop running the app

To stop the app when running with Docker:

```
docker compose down
```

To stop the app when running it locally (both backend and frontend):
Press `Ctrl + C` inside running terminal to stop the backend and frontend server.

## API Documentation

### Endpoints

#### Authentification

#### User

#### Courses
-   **GET /api/courses**: Get all courses
-   **GET /api/courses/:id**: Get course details by ID
-   **GET /api/courses/:id/progress**: Get user's progress in a specific course (Only for Postman testing - admin)
-   **GET /api/courses/progress/all**: Get user's progress across all courses

#### Modules
-   **GET /api/modules**: Get all modules
-   **GET /api/modules/:id**: Get module details by ID
-   **GET /api/modules/course/:courseId**: Get modules for a specific course (Only for Postman testing - admin)
-   **GET /api/modules/course/:courseId/progress**: Get user's progress in modules

#### Lessons

-   **GET /api/lesson**: Get all lessons (optional moduleId filter)
-   **GET /api/lesson/:id**: Get lesson details by ID
-   **GET /api/lesson/module/:moduleId**: Get lessons for a specific module (Only for Postman testing - admin)
-   **GET /api/lesson/module/:moduleId/progress**: Get user's progress in lessons

#### Exercises

-   **GET /api/exercises**: Get all exercises (optional lessonId filter)
-   **GET /api/exercises/:id**: Get exercise details
-   **GET /api/exercises/lesson/:lessonId**: Get exercises for specific lesson (Only for Postman testing - admin)
-   **GET /api/exercises/status/lesson/:lessonId**: Get exercise status with user progress
-   **POST /api/exercises/:id/check**: Submit answer and check correctness, check logical hearts and streaks functions

#### Exercise Options

-   **GET /api/exercise-options/exercise/:exerciseId**: Get options for an exercise

#### Pronunciation & Vocabulary
-   **GET /api/vocabulary/groups**: Get all sound groups
-   **GET /api/vocabulary/groups/:id**: Get sound group by ID
-   **GET /api/vocabulary/sounds/:id**: Get sound by ID

### Data Models

#### User
-   `id`: string,            
-   `email`: string,         
-   `username`: string,      
-   `password`: string,      
-   `firstName`: string?,    
-   `lastName`: string?,     
-   `level`: number,         **Current level (default: 1)**
-   `xp`: number,             **Xp points (default: 0)**
-   `streak`: number,         **Consecutive correct answers (default: 0)**
-   `hearts`: number,         **Available attempts (default: 5)**
-   `lastLogin`: DateTime?,  
-   `createdAt`: DateTime,   
-   `updatedAt`: DateTime    

#### Course
-   `id`: number,          
-   `title`: string,         **Course title (e.g., "German A1.1")**
-   `description`: string?,  
-   `imageSrc`: string,    
-   `level`: LanguageLevel,   **A1_1, A1_2, A2_1, A2_2**
-   `order`: number,         **Display order**
-   `isActive`: boolean,     **Course availability**
-   `createdAt`: DateTime    


#### Module
-   ``id``: number,            
-   ``courseId``: number,      
-   ``title``: string,         
-   ``description``: string?,  **Optional**
-   ``order``: number,         **Display order**
-   ``requiredXP``: number,    **XP required to unlock (default: 0)**
-   ``xpReward``: number,      **XP gained on completion**
-   ``estimatedTime``: number?, 
-   ``isLocked``: boolean,      **Lock status (default: false)**
-   ``createdAt``: DateTime   

#### Lesson
-   `id`: number,            
-   `moduleId`: number,      
-   `title`: string,          **Lesson title**
-   `description`: string?,   **Optional** 
-   `order`: number,         
-   `xpReward`: number,      ** XP gained on completion**
-   `estimatedTime`: number?, 
-   `createdAt`: DateTime

#### Exercise
-   `id`: number,            
-   `lessonId`: number,      
-   `type`: ExerciseType,     **MULTIPLE_CHOICE, FILL_IN_BLANK, etc.**
-   `question`: string,       **Exercise question**
-   `instruction`: string?,  **Optional**
-   `order`: number,         
-   `xpReward`: number,       **XP gained **
-   `timeLimit`: number?,    
-   `createdAt`: DateTime    

#### ExerciseOption
-   `id`: number,            
-   `exerciseId`: number,    
-   `text`: string,          
-   `isCorrect`: boolean,     **Whether this is a correct answer (True/Flase)**
-   `imageSrc`: string?,      **Optional image**
-   `audioSrc`: string?,      **Optional audio**
-   `order`: number?  

#### Pronouciation
-   `id`: number,            
-   `symbol`: string,         **Sound symbol (e.g., "ö", "ß")**
-   `exampleWord`: string,   **Example word using this sound**
-   `audioSrc`: string,       **Audio pronunciation URL**
-   `type`: SoundType,        **VOWEL, CONSONANT, DIPHTHONG, UMLAUT**
-   `createdAt`: DateTime

#### ExerciseProgress
-   `id`: number,            
-   `userId`: string,        
-   `exerciseId`: number?,   
-   `completed`: boolean,     **Completion status**
-   `completedAt`: DateTime? 

#### UserProgress
-   `id`: string,            
-   `userId`: string,        
-   `lessonId`: string,      
-   `exerciseId`: string?,   
-   `completed`: boolean,     **Completion status**
-   `score`: number?,        **(replaced by XP)**
-   `attempts`: number,       **Number of attempts**
-   `completedAt`: DateTime?, **Completion timestamp**
-   `createdAt`: DateTime,   
-   `updatedAt`: DateTime    


## Testing
The project includes automated tests for the backend using Jest. To run the tests, use the following command at project directory:

```bash
cd backend
npm run test
```
## Contributors
- Chi Thien Nguyen
- Thanh Trung Le
- Truc Quynh Nguyen
- Minh Vu Nguyen Quang