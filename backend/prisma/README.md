# README FOR STRUCTURES AND DATABASE

By default, our seed script preserves user progress while refreshing course content. To reset all data including user progress, uncomment the "// await cleanDatabase();" lines for user tables in prisma/seed.ts before running the seed command.

Ý tưởng xây dựng Database ()

Core Data Structure:
A1.1 → A1.2 → A2.1 → A2.2
Course(A1.1,...) > Module() -> Lesson -> Exercise

Example (Vi Du)

```
Course (A1.1)
└── Module ("Family, Food, Animals, Shopping")
    └── Lesson ("Animals - Tiere") - Tương đương với với level của Course
        └── Exercise (Multiple Choice: "Wie heisst deine Katze?")
            ├── Options: "Mein Katze heisst..."
            └── Vocabulary: "die Katze" (die, "die Katzen"),...
```

#### Exercise

- Multiple choices
- Fill in Blank (điền vào chỗ trống)
- Sentences Arrangments (Sắp xếp câu)
- Vocabulary check (Kiểm trả nghĩa của từ mới)

**Nice to Have:**

- Add Quiz, challenges
- Vocabulary exercises with pictures
- Text to speech, speech to text
- Word audios, text audio

Organize Template Data in JSON (Duolingo templates)

```
@ Todo
Gamification System
-   User's Process : level, points , heart, XP, hearts, streak system,...
-   Level requirement: for example, must reach this level to unlock new stuffs
```

```
@Learning Flow:
1.  Start at level 1/ start at A1.1: basic modules unlocked.
2.  Complete excersices/quiz -> gain XP -> unlock lesson/modules (Gamification)
3.  Earn enough XP -> gain access to higher courses/level (A1.1, A1.2,..)
.....

```

```
npx prisma migrate dev --name init :Create new migrate(s) :
npx prisma generate : (Apply for Clients after updateing schema.prisma)
npx prisma migrate reset: drop the database, reapply all migrate (Only if there aren't important data)
(manually in pgadmin safer):
```

````

Databank Table
npx prisma studio

When running the project via Docker Compose, execute Prisma Studio inside the
backend container so it can reach the `db` service. Expose port `5555` in
`docker-compose.yml`:

```yaml
  backend:
    ports:
      - "3000:3000"
      - "5555:5555" # allow Prisma Studio access
````

Start Prisma Studio with the container's port and hostname options so it is
accessible from your host:

```bash
docker compose exec backend npx prisma studio --port 5555 --hostname 0.0.0.0
```

If you prefer to run Prisma Studio on your host machine, override the
`DATABASE_URL` to use `localhost` instead of `db`:

```bash
DATABASE_URL="postgresql://germangains:germangains@db:5432/germangainsdb?schema=public" npx prisma studio
# DATABASE_URL="postgresql://germangains:germangains@localhost:5432/germangainsdb?schema=public" npx prisma studio
```

```

## Insert, Delete, Update,.. data for models
Run the command to manipulate the database
```

npx prisma db seed

```
When the models start growing larger
-> Organize the script into sections or break it into multiple files OR EVEN BETTER JSON FILES!!

```

## What is missing!!

Sounds and Images for ExerciseOption(Hien tai dang la Optionoal)
Image for Course
Sounds for GermanSound (Pronounciation)

```

# Current Database Structure
 ![alt text](backend/archive/uml.png)
```
