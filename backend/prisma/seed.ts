import { PrismaClient, ExerciseType, LanguageLevel, SoundType, NotificationType, ReviewItemType, AuditAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  //  !!!!!!! CLEANING DATA, UNCOMMENT THIS LINE BELOW TO RESET DATABASE!!!!!!!!!!

  await cleanDatabase();

  //  !!!!!!! PRESERVING USERS DATA, AND RESET CONTENt SEQUENCES!!!!!!!!!!
  await cleanContentOnly();

  // Create a demo user account
  const demoUser = await createUser();
  await clearUserActivity(demoUser.id);
  await createFakeUsers();
  // Create course progression (A1.1 - A2.2)
  const courses = await createCourses();
  // Create modules for A1.1 (first unlocked, second locked)
  const modules = await createModules(courses[0].id);
  // Create lessons for first module (first unlocked, others locked)
  const lessons = await createFirstModuleLessons(modules[0].id);
  // Create lessons for second module (all locked - placeholders)
  await createSecondModuleLessons(modules[1].id);
  // Create exercises for first lesson
  await createExercisesForFirstLesson(lessons[0].id);
  // Create exercises for second lesson
  await createExercisesForSecondLesson(lessons[1].id);
  // Create exercises for third lesson
  await createExercisesForThirdLesson(lessons[2].id);
  // Create exercises for fourth lesson
  await createExercisesForFourthLesson(lessons[3].id);
  // Create exercises for fifth lesson
  await createExercisesForFifthLesson(lessons[4].id);
  
  // Create pronunciation data

  await createPronunciationData();
  await createSeedNotifications(demoUser.id);
  await createSeedReviewItems(demoUser.id, lessons);
  await createSeedAuditLogs(demoUser.id);

  console.log('Database seeding completed successfully!');
}

async function cleanDatabase() {
  console.log('Cleaning existing database records...');
  
  
  // Delete in correct order (respecting foreign key constraints)
  await prisma.exerciseProgress.deleteMany();
  await prisma.reviewItem.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.soundGroupSound.deleteMany();
  await prisma.germanSound.deleteMany();
  await prisma.soundGroup.deleteMany();
  await prisma.exerciseOption.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.modulePrerequisite.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  await prisma.$executeRaw`ALTER SEQUENCE exercises_id_seq RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE exercise_options_id_seq RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE lessons_id_seq RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE modules_id_seq RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE courses_id_seq RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE german_sounds_id_seq RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE sound_groups_id_seq RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE sound_group_sounds_id_seq RESTART WITH 1;`;
  
  
  console.log('Database cleaned successfully.');
}

async function cleanContentOnly() {
  console.log('Cleaning only content data, preserving users...');
  
  try {
    // First delete relationships and dependent data
    await prisma.exerciseProgress.deleteMany();
    await prisma.soundGroupSound.deleteMany();
    await prisma.userProgress.deleteMany();
    
    // Then delete content entities
    await prisma.germanSound.deleteMany();
    await prisma.soundGroup.deleteMany();
    await prisma.exerciseOption.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.modulePrerequisite.deleteMany();
    await prisma.module.deleteMany();
    await prisma.course.deleteMany();
    
    // Reset content sequences but not user sequences
    await prisma.$executeRaw`ALTER SEQUENCE exercises_id_seq RESTART WITH 1;`;
    await prisma.$executeRaw`ALTER SEQUENCE exercise_options_id_seq RESTART WITH 1;`;
    await prisma.$executeRaw`ALTER SEQUENCE lessons_id_seq RESTART WITH 1;`;
    await prisma.$executeRaw`ALTER SEQUENCE modules_id_seq RESTART WITH 1;`;
    await prisma.$executeRaw`ALTER SEQUENCE courses_id_seq RESTART WITH 1;`;
    await prisma.$executeRaw`ALTER SEQUENCE german_sounds_id_seq RESTART WITH 1;`;
    await prisma.$executeRaw`ALTER SEQUENCE sound_groups_id_seq RESTART WITH 1;`;
    
    console.log('Content data cleaned without affecting user data');
  } catch (error) {
    console.error('Error while cleaning content data:', error);
    throw error; // Re-throw to handle in the calling function
  }
}

/**
 * Creates a demo user for testing the application
 */
async function createUser() {
  console.log('Creating demo user...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
  where: { email: "demo@germangains.com" },
  update: {}, // No changes if it exists
  create: {
    email: "demo@germangains.com",
      username: 'demouser',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      level: 1,
      xp: 0,
      streak: 0
    }
  });
  
  console.log(`Created demo user: ${user.username}`);
  return user;
}

async function createFakeUsers() {
  console.log('Creating fake users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const fakeUsers = [
    {
      email: 'anna.schmidt@example.com',
      username: 'annaschmidt',
      password: hashedPassword,
      firstName: 'Anna',
      lastName: 'Schmidt',
      level: 1,
      xp: 120,
      streak: 0,
    },
    {
      email: 'ben.mueller@example.com',
      username: 'benmueller',
      password: hashedPassword,
      firstName: 'Ben',
      lastName: 'Müller',
      level: 1,
      xp: 80,
      streak: 0,
    },
    {
      email: 'clara.schneider@example.com',
      username: 'claraschneider',
      password: hashedPassword,
      firstName: 'Clara',
      lastName: 'Schneider',
      level: 1,
      xp: 150,
      streak: 0,
    },
    {
      email: 'david.fischer@example.com',
      username: 'davidfischer',
      password: hashedPassword,
      firstName: 'David',
      lastName: 'Fischer',
      level: 1,
      xp: 60,
      streak: 0,
    },
    {
      email: 'emma.weber@example.com',
      username: 'emmaweber',
      password: hashedPassword,
      firstName: 'Emma',
      lastName: 'Weber',
      level: 1,
      xp: 40,
      streak: 0,
    },
  ];

  for (const data of fakeUsers) {
    await prisma.user.create({ data });
  }

  console.log(`Created ${fakeUsers.length} fake users.`);
}

async function clearUserActivity(userId: string) {
  await prisma.reviewItem.deleteMany({ where: { userId } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.userAchievement.deleteMany({ where: { userId } });
  await prisma.auditLog.deleteMany({ where: { userId } });
}

async function createSeedNotifications(userId: string) {
  await prisma.notification.createMany({
    data: [
      {
        userId,
        title: "Welcome back!",
        body: "Your daily goal is ready. Earn 50 XP today.",
        type: NotificationType.REMINDER,
      },
      {
        userId,
        title: "Review scheduled",
        body: "A lesson review is due today. Visit the Review page.",
        type: NotificationType.SYSTEM,
      },
      {
        userId,
        title: "Streak bonus",
        body: "Complete one lesson to extend your streak.",
        type: NotificationType.STREAK,
      },
    ],
  });
}

async function createSeedReviewItems(userId: string, lessons: { id: number }[]) {
  const base = new Date();
  base.setDate(base.getDate() - 1);
  const data = lessons.slice(0, 2).map((lesson, idx) => ({
    userId,
    itemType: ReviewItemType.LESSON,
    lessonId: lesson.id,
    dueAt: new Date(base.getTime() + idx * 3600 * 1000),
    intervalDays: 1,
  }));

  await prisma.reviewItem.createMany({ data });
}

async function createSeedAuditLogs(userId: string) {
  await prisma.auditLog.createMany({
    data: [
      { userId, action: AuditAction.LOGIN, entity: "auth", metadata: { ip: "127.0.0.1" } },
      { userId, action: AuditAction.PROGRESS_UPDATE, entity: "lesson", metadata: { lessonId: 1 } },
      { userId, action: AuditAction.PROFILE_UPDATE, entity: "profile", metadata: { field: "username" } },
    ],
  });
}

/**
 * Creates German courses with progression
 */
async function createCourses() {
  console.log('Creating German language courses...');
  
  const courses = await Promise.all([
    // A1.1 - Unlocked (beginner course)
    prisma.course.create({
      data: {
        title: 'German A1.1',
        description: 'Start your German journey with essential vocabulary, basic greetings, and simple phrases.',
        level: 'A1_1',
        imageSrc: '',
        order: 1,
        isActive: true
      }
    }),
    
    // A1.2 - Locked (progression)
    prisma.course.create({
      data: {
        title: 'German A1.2',
        description: 'Continue building your foundation with more vocabulary and basic conversation practice.',
        level: 'A1_2',
        imageSrc: '',
        order: 2,
        isActive: true
      }
    }),
    
    // A2.1 - Locked (progression)
    prisma.course.create({
      data: {
        title: 'German A2.1',
        description: 'Begin intermediate German with more complex grammar and everyday situations.',
        level: 'A2_1',
        imageSrc: '',
        order: 3,
        isActive: true
      }
    }),
    
    // A2.2 - Locked (progression)
    prisma.course.create({
      data: {
        title: 'German A2.2',
        description: 'Complete your basic proficiency with advanced vocabulary and practical conversation skills.',
        level: 'A2_2',
        imageSrc: '',
        order: 4,
        isActive: true
      }
    })
  ]);
  
  console.log(`Created ${courses.length} German courses with progression path.`);
  return courses;
}

/**
 * Creates modules for the A1.1 course
 */
async function createModules(courseId: number) {
  console.log('Creating modules for German A1.1...');
  
  const modules = await Promise.all([
    // First module - Unlocked
    prisma.module.create({
      data: {
        courseId: courseId,
        title: 'Greetings and Introductions',
        description: 'Learn how to greet people and introduce yourself in German.',
        order: 1,
        requiredXP: 0,
        xpReward: 50,
        estimatedTime: 60, // minutes
        isLocked: false
      }
    }),
    
    // Second module - Locked
    prisma.module.create({
      data: {
        courseId: courseId,
        title: 'Numbers and Counting',
        description: 'Learn German numbers and how to count from 1 to 100.',
        order: 2,
        requiredXP: 50, // Requires XP from first module
        xpReward: 50,
        estimatedTime: 45, // minutes
        isLocked: true
      }
    }),

    prisma.module.create({
      data: {
        courseId: courseId,
        title: 'German Articles and Pronouns',
        description: 'Learn the basics of German articles and personal pronouns.',
        order: 3,
        requiredXP: 100, // Requires XP from second module
        xpReward: 50,
        estimatedTime: 60, // minutes
        isLocked: true
      }
    })
  ]);
  
  // Set prerequisite relationship: Second module requires first module
  await prisma.modulePrerequisite.create({
    data: {
      moduleId: modules[1].id,
      prerequisiteId: modules[0].id
    }
  });

  // Set prerequisite relationship: Third module requires second module
  await prisma.modulePrerequisite.create({
    data: {
      moduleId: modules[2].id,
      prerequisiteId: modules[1].id
    }
  });
  
  console.log(`Created ${modules.length} modules with prerequisites established.`);
  return modules;
}

/**
 * Creates lessons for the first module (greetings)
 */
async function createFirstModuleLessons(moduleId: number) {
  console.log('Creating lessons for Greetings and Introductions module...');
  
  const lessons = await Promise.all([
    // Lesson 1: Basic Greetings - Unlocked
    prisma.lesson.create({
      data: {
        moduleId: moduleId,
        title: 'Basic Greetings',
        description: 'Learn essential German greetings for different times of day.',
        order: 1,
        xpReward: 10,
        estimatedTime: 15 // minutes
      }
    }),
    
    // Lesson 2: Introducing Yourself - Locked
    prisma.lesson.create({
      data: {
        moduleId: moduleId,
        title: 'Introducing Yourself',
        description: "Learn how to introduce yourself and ask someone's name in German.",
        order: 2,
        xpReward: 10,
        estimatedTime: 15 // minutes
      }
    }),
    
    // Lesson 3: Formal vs Informal - Locked
    prisma.lesson.create({
      data: {
        moduleId: moduleId,
        title: 'Formal vs Informal Speech',
        description: 'Learn the difference between formal and informal speech in German.',
        order: 3,
        xpReward: 10,
        estimatedTime: 10 // minutes
      }
    }),
    
    // Lesson 4: Asking Simple Questions - Locked
    prisma.lesson.create({
      data: {
        moduleId: moduleId,
        title: 'Asking Simple Questions',
        description: 'Learn how to ask basic questions in German conversations.',
        order: 4,
        xpReward: 10,
        estimatedTime: 10 // minutes
      }
    }),
    
    // Lesson 5: Common Phrases - Locked
    prisma.lesson.create({
      data: {
        moduleId: moduleId,
        title: 'Common Everyday Phrases',
        description: 'Essential phrases for daily German conversations.',
        order: 5,
        xpReward: 10,
        estimatedTime: 10 // minutes
      }
    })
  ]);
  
  console.log(`Created ${lessons.length} lessons for first module.`);
  return lessons;
}

/**
 * Creates placeholder lessons for the second module
 */
async function createSecondModuleLessons(moduleId: number) {
  console.log('Creating placeholder lessons for Numbers and Counting module...');
  
  const lessons = await Promise.all([
    // Lesson 1: Numbers 1-10
    prisma.lesson.create({
      data: {
        moduleId: moduleId,
        title: 'Numbers 1-10',
        description: 'Learn how to count from one to ten in German.',
        order: 1,
        xpReward: 10,
        estimatedTime: 10 // minutes
      }
    }),
    
    // Lesson 2: Numbers 11-20
    prisma.lesson.create({
      data: {
        moduleId: moduleId,
        title: 'Numbers 11-20',
        description: 'Learn how to count from eleven to twenty in German.',
        order: 2,
        xpReward: 10,
        estimatedTime: 10 // minutes
      }
    }),
    
    // Lesson 3: Numbers 21-100
    prisma.lesson.create({
      data: {
        moduleId: moduleId,
        title: 'Numbers 21-100',
        description: 'Learn how to count from twenty-one to one hundred in German.',
        order: 3,
        xpReward: 10,
        estimatedTime: 15 // minutes
      }
    }),
    
    // Lesson 4: Ordinal Numbers
    prisma.lesson.create({
      data: {
        moduleId: moduleId,
        title: 'Ordinal Numbers',
        description: 'Learn ordinal numbers in German (first, second, third, etc.).',
        order: 4,
        xpReward: 10,
        estimatedTime: 10 // minutes
      }
    }),
    
    // Lesson 5: Talking About Age
    prisma.lesson.create({
      data: {
        moduleId: moduleId,
        title: 'Talking About Age',
        description: 'Learn how to talk about your age and ask others in German.',
        order: 5,
        xpReward: 10,
        estimatedTime: 10 // minutes
      }
    })
  ]);
  
  console.log(`Created ${lessons.length} placeholder lessons for second module.`);
  return lessons;
}

/**
 * Creates exercises for the first unlocked lesson
 */
async function createExercisesForFirstLesson(lessonId: number) {
  console.log('Creating exercises for Basic Greetings lesson...');
  
  // Exercise 1: Multiple Choice
  const exercise1 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'What does "Hallo" mean in English?',
      instruction: 'Choose the correct translation',
      order: 1,
      xpReward: 2,
      timeLimit: 15 // seconds
    }
  });
  
  // Options for Exercise 1
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise1.id, text: 'Hello', isCorrect: true, order: 1 },
      { exerciseId: exercise1.id, text: 'Goodbye', isCorrect: false, order: 2 },
      { exerciseId: exercise1.id, text: 'Thank you', isCorrect: false, order: 3 },
      { exerciseId: exercise1.id, text: 'Please', isCorrect: false, order: 4 }
    ]
  });
  
  // Exercise 2: Fill in the Blank
  const exercise2 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'FILL_IN_BLANK',
      question: 'Complete the morning greeting: G_____ Morgen!',
      instruction: 'Fill in the missing letters',
      order: 2,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  
  // Options for Exercise 2
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise2.id, text: 'uten', isCorrect: true, order: 1 }
    ]
  });
  
  // Exercise 3: Multiple Choice
  const exercise3 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'How do you say "goodbye" in German?',
      instruction: 'Select the correct answer',
      order: 3,
      xpReward: 2,
      timeLimit: 15 // seconds
    }
  });
  
  // Options for Exercise 3
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise3.id, text: 'Auf Wiedersehen', isCorrect: true, order: 1 },
      { exerciseId: exercise3.id, text: 'Guten Tag', isCorrect: false, order: 2 },
      { exerciseId: exercise3.id, text: 'Danke schön', isCorrect: false, order: 3 },
      { exerciseId: exercise3.id, text: 'Wie geht\'s', isCorrect: false, order: 4 }
    ]
  });
  
  // Exercise 4: Vocabulary Check - sua lai thanh multi
  const exercise4 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'How do you say "Good Morning" in German?',
      instruction: '',
      order: 4,
      xpReward: 3,
      timeLimit: 30 // seconds
    }
  });
  
  // Options for Exercise 4
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise4.id, text: 'Guten Abend', isCorrect: false, order: 1 },
      { exerciseId: exercise4.id, text: 'Guten Appetit', isCorrect: false, order: 2 },
      { exerciseId: exercise4.id, text: 'Guten Morgen', isCorrect: true, order: 3 },
      { exerciseId: exercise4.id, text: 'Gute Nacht', isCorrect: false, order: 4 }
    ]
  });
  
  // Exercise 5: Multiple Choice
  const exercise5 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'When would you use "Gute Nacht"?',
      instruction: 'Choose the most appropriate situation',
      order: 5,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  
  // Options for Exercise 5
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise5.id, text: 'When someone is going to sleep', isCorrect: true, order: 1 },
      { exerciseId: exercise5.id, text: 'When meeting someone in the morning', isCorrect: false, order: 2 },
      { exerciseId: exercise5.id, text: 'When greeting someone in the afternoon', isCorrect: false, order: 3 },
      { exerciseId: exercise5.id, text: 'When saying goodbye in the evening', isCorrect: false, order: 4 }
    ]
  });
  
  console.log('Created 5 diverse exercises for the first lesson.');
}

async function createExercisesForSecondLesson(lessonId: number) {
  console.log('Creating exercises for Introducing Yourself lesson...');
  
  // Exercise 1: Fill in the Blank
  const exercise1 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'FILL_IN_BLANK',
      question: 'Complete the sentence: Ich _____ Thien.',
      instruction: 'Fill in your name',
      order: 1,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  
  // Options for Exercise 1
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise1.id, text: 'bin', isCorrect: true, order: 1 },
      { exerciseId: exercise1.id, text: 'heisse', isCorrect: true, order: 2 },
      { exerciseId: exercise1.id, text: 'heiße', isCorrect: true, order: 3 }
    ]
  });
  
  // Exercise 2: Multiple Choice
  const exercise2 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'What does "Wie heißen Sie?" mean?',
      instruction: 'Choose the correct translation',
      order: 2,
      xpReward: 2,
      timeLimit: 15 // seconds
    }
  });
  
  // Options for Exercise 2
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise2.id, text: 'What is your name?', isCorrect: true, order: 3 },
      { exerciseId: exercise2.id, text: 'How are you?', isCorrect: false, order: 2 },
      { exerciseId: exercise2.id, text: 'Where are you from?', isCorrect: false, order: 1 },
      { exerciseId: exercise2.id, text: 'What do you do?', isCorrect: false, order: 4 }
    ]
  });
  
  // Exercise 3 - Vocabulary Check
  const exercise3 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'How do you say "Im from..." in German?',
      instruction: '',
      order: 3,
      xpReward: 3,
      timeLimit: 30 // seconds
    }
  });
  // Options for Exercise 3
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise3.id, text: 'Ich heiße...', isCorrect: false, order: 1 },
      { exerciseId: exercise3.id, text: 'Ich bin...', isCorrect: false, order: 2 },
      { exerciseId: exercise3.id, text: 'Mein Name ist...', isCorrect: false, order: 3 },
      { exerciseId: exercise3.id, text: 'Ich komme aus...', isCorrect: true, order: 4 }
    ]
  });

  // Exercise 4: Multiple Choice
  const exercise4 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'How do you ask someone their name in German?',
      instruction: 'Select the correct question',
      order: 4,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  // Options for Exercise 4
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise4.id, text: 'Wie alt sind Sie?', isCorrect: false, order: 1 },
      { exerciseId: exercise4.id, text: 'Wie heißen Sie?', isCorrect: true, order: 2 },
      { exerciseId: exercise4.id, text: 'Woher kommen Sie?', isCorrect: false, order: 3 },
      { exerciseId: exercise4.id, text: 'Was machen Sie?', isCorrect: false, order: 4 }
    ]
  });

  // Exercise 5: Multiple Choice
  const exercise5 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'What is the correct response to "Wie geht\'s?"',
      instruction: 'Choose the most appropriate answer',
      order: 5,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });

  // Options for Exercise 5
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise5.id, text: 'Mir geht\'s gut, danke.', isCorrect: true, order: 1 },
      { exerciseId: exercise5.id, text: 'Ich heiße Thien.', isCorrect: false, order: 2 },
      { exerciseId: exercise5.id, text: 'Ich komme aus Vietnam.', isCorrect: false, order: 3 },
      { exerciseId: exercise5.id, text: 'Ich bin 25 Jahre alt.', isCorrect: false, order: 4 }
    ]
  });
  console.log('Created 5 diverse exercises for the second lesson.');
}

async function createExercisesForThirdLesson(lessonId: number) {
  console.log('Creating exercises for Formal vs Informal Speech lesson...');
  // Exercise 1: Multiple Choice
  const exercise1 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'You would like to ask an adult stranger for the time. Which form of "you" would you use in German?',
      instruction: 'Choose the correct form of address',
      order: 1,
      xpReward: 2,
      timeLimit: 15 // seconds
    }
  });
  // Options for Exercise 1
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise1.id, text: 'Du', isCorrect: false, order: 1 },
      { exerciseId: exercise1.id, text: 'Sie', isCorrect: true, order: 2 },
      { exerciseId: exercise1.id, text: 'Ihr', isCorrect: false, order: 3 },
      { exerciseId: exercise1.id, text: 'Er', isCorrect: false, order: 4 }
    ]
  });
  // Exercise 2: Fill in the Blank
  const exercise2 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'FILL_IN_BLANK',
      question: 'A Polite expression used before starting a meal : Guten _____!',
      instruction: 'Fill in the missing word',
      order: 2,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  // Options for Exercise 2
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise2.id, text: 'Hunger', isCorrect: true, order: 1 },
      { exerciseId: exercise2.id, text: 'hunger', isCorrect: true, order: 2 },
      { exerciseId: exercise2.id, text: 'Apetit', isCorrect: true, order: 3 },
      { exerciseId: exercise2.id, text: 'apetit', isCorrect: true, order: 4 }
    ]
  });

  // Exercise 3: Multiple Choice
  const exercise3 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'When should you use "Du" instead of "Sie"?',
      instruction: 'Select the most appropriate situation',
      order: 3,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  // Options for Exercise 3
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise3.id, text: 'When speaking to a stranger', isCorrect: false, order: 1 },
      { exerciseId: exercise3.id, text: 'When addressing a friend', isCorrect: true, order: 2 },
      { exerciseId: exercise3.id, text: 'When speaking to a boss', isCorrect: false, order: 3 },
      { exerciseId: exercise3.id, text: 'When addressing a group', isCorrect: false, order: 4 }
    ]
  });
  // Exercise 4: Vocabulary Check
  const exercise4 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'How do you say "See you again" in German?',
      instruction: '',
      order: 4,
      xpReward: 3,
      timeLimit: 30 // seconds
    }
  });
  // Options for Exercise 4
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise4.id, text: 'Auf Wiedersehen', isCorrect: true, order: 1 },
      { exerciseId: exercise4.id, text: 'Bis gleich', isCorrect: true, order: 2 },
      { exerciseId: exercise4.id, text: 'Wir sehen uns', isCorrect: true, order: 3 },
      { exerciseId: exercise4.id, text: 'Bis dann', isCorrect: true, order: 4 }
    ]
  });

  // Exercise 5: Multiple Choice
  const exercise5 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'What is the informal way to ask "How are you?" in German?',
      instruction: 'Choose the correct question',
      order: 5,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  // Options for Exercise 5
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise5.id, text: 'Wie geht es Ihnen?', isCorrect: false, order: 1 },
      { exerciseId: exercise5.id, text: 'Wie geht\'s dir?', isCorrect: true, order: 2 },
      { exerciseId: exercise5.id, text: 'Wie heißen Sie?', isCorrect: false, order: 3 },
      { exerciseId: exercise5.id, text: 'Woher kommen Sie?', isCorrect: false, order: 4 }
    ]
  });
  console.log('Created 5 diverse exercises for the third lesson.');
}

async function createExercisesForFourthLesson(lessonId: number) {
  console.log('Creating exercises for Asking Simple Questions lesson...');
  // Exercise 1: Multiple Choice
  const exercise1 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'What is the correct way to ask "Where are you from?" in German',
      instruction: 'Choose the correct question',
      order: 1,
      xpReward: 2,
      timeLimit: 15 // seconds
    }
  });
  // Options for Exercise 1
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise1.id, text: 'Woher kommen Sie?', isCorrect: true, order: 1 },
      { exerciseId: exercise1.id, text: 'Wo wohnen Sie?', isCorrect: false, order: 2 },
      { exerciseId: exercise1.id, text: 'Wie heißen Sie?', isCorrect: false, order: 3 },
      { exerciseId: exercise1.id, text: 'Wie alt sind Sie?', isCorrect: false, order: 4 }
    ]
  });
  // Exercise 2: Fill in the Blank
  const exercise2 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'FILL_IN_BLANK',
      question: 'Complete the question: Woher _____ Sie?',
      instruction: 'Fill in the missing word',
      order: 2,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  // Options for Exercise 2
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise2.id, text: 'kommen', isCorrect: true, order: 1 },
    ]
  });
  // Exercise 3: Multiple Choice
  const exercise3 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'How do you ask "What is your job?" in German?',
      instruction: 'Select the correct question',
      order: 3,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  // Options for Exercise 3
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise3.id, text: 'Was machen Sie beruflich?', isCorrect: true, order: 1 },
      { exerciseId: exercise3.id, text: 'Woher kommen Sie ursprünglich?', isCorrect: false, order: 2 },
      { exerciseId: exercise3.id, text: 'Wie heißen Sie?', isCorrect: false, order: 3 },
      { exerciseId: exercise3.id, text: 'Wie alt sind Sie?', isCorrect: false, order: 4 }
    ]
  });
  // Exercise 4: Vocabulary Check
  const exercise4 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'How do you say "Im from Vietnam" in German?',
      instruction: '',
      order: 4,
      xpReward: 3,
      timeLimit: 30 // seconds
    }
  });
  // Options for Exercise 4
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise4.id, text: 'Ich komme aus Vietnam', isCorrect: true, order: 1 },
      { exerciseId: exercise4.id, text: 'Ich wohne in Vietnam', isCorrect: false, order: 2 },
      { exerciseId: exercise4.id, text: 'Ich bin in Vietnam geboren', isCorrect: false, order: 3 },
      { exerciseId: exercise4.id, text: 'Ich liebe Vietnam', isCorrect: false, order: 4 }
    ]
  });
  // Exercise 5: Multiple Choice
  const exercise5 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'What is the correct way to ask "How old are you?" in German?',
      instruction: 'Choose the correct question',
      order: 5,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  // Options for Exercise 5
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise5.id, text: 'Wie alt sind Sie?', isCorrect: true, order: 1 },
      { exerciseId: exercise5.id, text: 'Wie heißen Sie?', isCorrect: false, order: 2 },
      { exerciseId: exercise5.id, text: 'Woher kommen Sie?', isCorrect: false, order: 3 },
      { exerciseId: exercise5.id, text: 'Was machen Sie?', isCorrect: false, order: 4 }
    ]
  });
  console.log('Created 5 diverse exercises for the fourth lesson.');
}
async function createExercisesForFifthLesson(lessonId: number) {
  console.log('Creating exercises for Common Everyday Phrases lesson...');
  // Exercise 1: Multiple Choice
  const exercise1 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'What does "Guten Appetit" mean?',
      instruction: 'Choose the correct translation',
      order: 1,
      xpReward: 2,
      timeLimit: 15 // seconds
    }
  });
  // Options for Exercise 1
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise1.id, text: 'Enjoy your meal', isCorrect: true, order: 1 },
      { exerciseId: exercise1.id, text: 'Goodbye', isCorrect: false, order: 2 },
      { exerciseId: exercise1.id, text: 'Good morning', isCorrect: false, order: 3 },
      { exerciseId: exercise1.id, text: 'Thank you', isCorrect: false, order: 4 }
    ]
  });
  // Exercise 2: Fill in the Blank
  const exercise2 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'FILL_IN_BLANK',
      question: 'Complete the Article: _____ Morgen!',
      instruction: 'Fill in the missing word',
      order: 2,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  // Options for Exercise 2
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise2.id, text: 'Der', isCorrect: true, order: 1 },
    ]
  });
  // Exercise 3: Multiple Choice
  const exercise3 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'How do you say "Thank you very much" in German?',
      instruction: 'Select the correct phrase',
      order: 3,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  // Options for Exercise 3
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise3.id, text: 'Vielen Dank', isCorrect: true, order: 1 },
      { exerciseId: exercise3.id, text: 'Danke schön', isCorrect: true, order: 2 },
      { exerciseId: exercise3.id, text: 'Danke sehr', isCorrect: true, order: 3 },
      { exerciseId: exercise3.id, text: 'Danke vielmals', isCorrect: true, order: 4 }
    ]
  });
  // Exercise 4: Vocabulary Check
  const exercise4 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'How do you say "Goodbye" in German?',
      instruction: '',
      order: 4,
      xpReward: 3,
      timeLimit: 30 // seconds
    }
  });
  // Options for Exercise 4
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise4.id, text: 'Auf Wiedersehen', isCorrect: true, order: 1 },
      { exerciseId: exercise4.id, text: 'Tschüss', isCorrect: true, order: 2 },
      { exerciseId: exercise4.id, text: 'Bis später', isCorrect: true, order: 3 },
      { exerciseId: exercise4.id, text: 'Bis bald', isCorrect: true, order: 4 }
    ]
  });
  // Exercise 5: Multiple Choice
  const exercise5 = await prisma.exercise.create({
    data: {
      lessonId: lessonId,
      type: 'MULTIPLE_CHOICE',
      question: 'What is the correct way to say "You have a good day" in German?',
      instruction: 'Choose the correct phrase',
      order: 5,
      xpReward: 2,
      timeLimit: 20 // seconds
    }
  });
  // Options for Exercise 5
  await prisma.exerciseOption.createMany({
    data: [
      { exerciseId: exercise5.id, text: 'Machts gut', isCorrect: true, order: 1 },
      { exerciseId: exercise5.id, text: 'Schönen Tag noch', isCorrect: true, order: 2 },
      { exerciseId: exercise5.id, text: 'Ciao', isCorrect: false, order: 3 },
      { exerciseId: exercise5.id, text: 'Guten Apetit', isCorrect: false, order: 4 }
    ]
  });
  console.log('Created 5 diverse exercises for the fifth lesson.');
}

/**
 * Creates pronunciation data (sound groups and sounds)
 */
async function createPronunciationData() {
  console.log('Creating pronunciation data...');
  
  // Create sound groups
  const vowelGroup = await prisma.soundGroup.create({
    data: {
      name: 'German Vowels',
      order: 1
    }
  });
  
  const umlautGroup = await prisma.soundGroup.create({
    data: {
      name: 'German Umlauts',
      order: 2
    }
  });
  
  const consonantGroup = await prisma.soundGroup.create({
    data: {
      name: 'Special Consonants',
      order: 3
    }
  });

    const dipthongsGroup = await prisma.soundGroup.create({
    data: {
      name: 'Special Diphthongs',
      order: 4
    }
  });
  
  // Create vowel sounds
  const vowelA = await prisma.germanSound.create({
    data: {
      symbol: 'a',
      exampleWord: 'Mann',
      type: 'VOWEL',
      audioSrc: '/assets/sounds/a-Mann.mp3'
    }
  });
  
  const vowelE = await prisma.germanSound.create({
    data: {
      symbol: 'e',
      exampleWord: 'Bett',
      type: 'VOWEL',
      audioSrc: '/assets/sounds/e-Bett.mp3'
    }
  });
  
  const vowelI = await prisma.germanSound.create({
    data: {
      symbol: 'i',
      exampleWord: 'Kind',
      type: 'VOWEL',
      audioSrc: '/assets/sounds/i-Kind.mp3'
    }
  });
  
  const vowelO = await prisma.germanSound.create({
    data: {
      symbol: 'o',
      exampleWord: 'Sonne',
      type: 'VOWEL',
      audioSrc: '/assets/sounds/o-Sonne.mp3'
    }
  });
  
  const vowelU = await prisma.germanSound.create({
    data: {
      symbol: 'u',
      exampleWord: 'Mutter',
      type: 'VOWEL',
      audioSrc: '/assets/sounds/u-Mutter.mp3'
    }
  });
  
  // Create umlaut sounds
  const umlautA = await prisma.germanSound.create({
    data: {
      symbol: 'ä',
      exampleWord: 'Mädchen',
      type: 'UMLAUT',
      audioSrc: '/assets/sounds/ä-Mädchen.mp3'
    }
  });
  
  const umlautO = await prisma.germanSound.create({
    data: {
      symbol: 'ö',
      exampleWord: 'schön',
      type: 'UMLAUT',
      audioSrc: '/assets/sounds/ö-schön.mp3'
    }
  });
  
  const umlautU = await prisma.germanSound.create({
    data: {
      symbol: 'ü',
      exampleWord: 'Tür',
      type: 'UMLAUT',
      audioSrc: '/assets/sounds/ü-Tür.mp3'
    }
  });
  
  // Create special consonant sounds
  const consonantCH = await prisma.germanSound.create({
    data: {
      symbol: 'ch',
      exampleWord: 'ich (I)',
      type: 'CONSONANT',
      audioSrc: '/assets/sounds/ich.mp3'
    }
  });
  
  const consonantSZ = await prisma.germanSound.create({
    data: {
      symbol: 'ß',
      exampleWord: 'Straße',
      type: 'CONSONANT',
      audioSrc: '/assets/sounds/ß-Straße.mp3'
    }
  });

  const consonantD = await prisma.germanSound.create({
    data: {
      symbol: 'd',
      exampleWord: 'danke',
      type: 'CONSONANT',
      audioSrc: '/assets/sounds/danke.mp3'
    }
  });

  const consonantG = await prisma.germanSound.create({
    data: {
      symbol: 'g',
      exampleWord: 'gut',
      type: 'CONSONANT',
      audioSrc: '/assets/sounds/gut.mp3'
    }
  });

  const consonantH = await prisma.germanSound.create({
    data: {
      symbol: 'h',
      exampleWord: 'Haus',
      type: 'CONSONANT',
      audioSrc: '/assets/sounds/h-Haus.mp3'
    }
  });

  const consonantR = await prisma.germanSound.create({
    data: {
      symbol: 'r',
      exampleWord: 'rot',
      type: 'CONSONANT',
      audioSrc: '/assets/sounds/r-rot.mp3'
    }
  });

  const consonantS = await prisma.germanSound.create({
    data: {
      symbol: 's',
      exampleWord: 'Sonne',
      type: 'CONSONANT',
      audioSrc: '/assets/sounds/s-Sonne.mp3'
    }
  });

  const consonantV = await prisma.germanSound.create({
    data: {
      symbol: 'v',
      exampleWord: 'Vater',
      type: 'CONSONANT',
      audioSrc: '/assets/sounds/v-Vater.mp3'
    }
  });

  const consonantW = await prisma.germanSound.create({
    data: {
      symbol: 'w',
      exampleWord: 'Wasser',
      type: 'CONSONANT',
      audioSrc: '/assets/sounds/w-Wasser.mp3'
    }
  });

  const consonantZ = await prisma.germanSound.create({
    data: {
      symbol: 'z',
      exampleWord: 'Zeit',
      type: 'CONSONANT',
      audioSrc: '/assets/sounds/z-Zeit.mp3'
    }
  });

    // Create Dipthong sounds
  const dipthongAU = await prisma.germanSound.create({
    data: {
      symbol: 'au',
      exampleWord: 'Haus',
      type: 'DIPHTHONG',
      audioSrc: '/assets/sounds/au-Haus.mp3'
    }
  });

  const dipthongEI = await prisma.germanSound.create({
    data: {
      symbol: 'ei',
      exampleWord: 'mein',
      type: 'DIPHTHONG',
      audioSrc: '/assets/sounds/ei-mein.mp3'
    }
  });

  const dipthongEU = await prisma.germanSound.create({
    data: {
      symbol: 'eu',
      exampleWord: 'neu',
      type: 'DIPHTHONG',
      audioSrc: '/assets/sounds/eu-neu.mp3'
    }
  });

  const dipthongAUe = await prisma.germanSound.create({
    data: {
      symbol: 'äu',
      exampleWord: 'Bäume',
      type: 'DIPHTHONG',
      audioSrc: '/assets/sounds/äu-Bäume.mp3'
    }
  });

  const dipthongIE = await prisma.germanSound.create({
    data: {
      symbol: 'ie',
      exampleWord: 'Liebe',
      type: 'DIPHTHONG',
      audioSrc: '/assets/sounds/ie-Liebe.mp3'
    }
  });


  
  // Associate sounds with groups
  // Vowels
  await Promise.all([
    prisma.soundGroupSound.create({ data: { soundId: vowelA.id, groupId: vowelGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: vowelE.id, groupId: vowelGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: vowelI.id, groupId: vowelGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: vowelO.id, groupId: vowelGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: vowelU.id, groupId: vowelGroup.id } })
  ]);
  
  // Umlauts
  await Promise.all([
    prisma.soundGroupSound.create({ data: { soundId: umlautA.id, groupId: umlautGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: umlautO.id, groupId: umlautGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: umlautU.id, groupId: umlautGroup.id } })
  ]);
  
  // Special consonants
  await Promise.all([
    prisma.soundGroupSound.create({ data: { soundId: consonantCH.id, groupId: consonantGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: consonantSZ.id, groupId: consonantGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: consonantD.id, groupId: consonantGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: consonantG.id, groupId: consonantGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: consonantH.id, groupId: consonantGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: consonantR.id, groupId: consonantGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: consonantS.id, groupId: consonantGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: consonantV.id, groupId: consonantGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: consonantW.id, groupId: consonantGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: consonantZ.id, groupId: consonantGroup.id } })
  ]);

  // Special Diphthongs
  await Promise.all([
    prisma.soundGroupSound.create({ data: { soundId: dipthongAU.id, groupId: dipthongsGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: dipthongEI.id, groupId: dipthongsGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: dipthongEU.id, groupId: dipthongsGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: dipthongAUe.id, groupId: dipthongsGroup.id } }),
    prisma.soundGroupSound.create({ data: { soundId: dipthongIE.id, groupId: dipthongsGroup.id } })
  ]); 
  
  console.log('Created pronunciation data with 3 sound groups and 10 German sounds.');
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Disconnecting from database...');
    await prisma.$disconnect();
  });
