import { ExerciseType, NotificationType, ReviewItemType, AuditAction } from "@prisma/client";
import { NotFoundError } from "../../utils/errors";
import prisma from "../../lib/prisma";
import * as achievementsService from "../achievements/achievements.service";
import * as auditService from "../audit/audit.service";


interface FindExercisesParams {
  lessonId?: number;
  type?: string;
}

interface CreateExerciseParams {
  lessonId: number;
  type: string; // Should match ExerciseType enum
  question: string;
  instruction?: string;
  order: number;
  xpReward?: number;
  timeLimit?: number;
  correctAnswer?: string; // For text-based answers
  options?: ExerciseOptionInput[];
}

interface ExerciseOptionInput {
  text: string;
  isCorrect: boolean;
  order?: number;
  imageSrc?: string;
  audioSrc?: string;
}

interface UpdateExerciseParams {
  type?: string;
  question?: string;
  instruction?: string | null;
  order?: number;
  xpReward?: number;
  timeLimit?: number | null;
  correctAnswer?: string;
  options?: ExerciseOptionInput[];
}

export const findExercises = async ({
  lessonId,
  type,
}: FindExercisesParams = {}) => {
  // Build where clause based on provided filters
  const where: any = {};

  if (lessonId) {
    where.lessonId = lessonId;
  }

  if (type) {
    where.type = type;
  }

  return prisma.exercise.findMany({
    where,
    orderBy: { order: "asc" },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          moduleId: true,
        },
      },
      exerciseOptions: {
        orderBy: { order: "asc" },
        // Don't include isCorrect in public queries for security
        select: {
          id: true,
          text: true,
          order: true,
          imageSrc: true,
          audioSrc: true,
        },
      },
    },
  });
};

export const findExerciseById = async (id: number) => {
  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          moduleId: true,
        },
      },
      exerciseOptions: {
        orderBy: { order: "asc" },
        // Don't include isCorrect in public queries
        select: {
          id: true,
          text: true,
          order: true,
          imageSrc: true,
          audioSrc: true,
        },
      },
    },
  });

  if (!exercise) {
    throw new NotFoundError(`Exercise with ID ${id} not found`);
  }

  return exercise;
};

export const findExerciseByIdWithAnswers = async (id: number) => {
  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: {
      lesson: true,
      exerciseOptions: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!exercise) {
    throw new NotFoundError(`Exercise with ID ${id} not found`);
  }

  return exercise;
};

export const createExercise = async (data: CreateExerciseParams) => {
  // First verify the lesson exists
  const lesson = await prisma.lesson.findUnique({
    where: { id: data.lessonId },
  });

  if (!lesson) {
    throw new NotFoundError(`Lesson with ID ${data.lessonId} not found`);
  }

  // Create the exercise and its options in a transaction to ensure data consistency
  return prisma.$transaction(async (prismaClient) => {
    // Create the exercise first
    const exercise = await prismaClient.exercise.create({
      data: {
        lessonId: data.lessonId,
        type: data.type as ExerciseType,
        question: data.question,
        instruction: data.instruction,
        order: data.order,
        xpReward: data.xpReward || 1,
        timeLimit: data.timeLimit,
      },
    });

    // If options are provided, create them for the exercise
    if (data.options && data.options.length > 0) {
      await Promise.all(
        data.options.map((option, index) =>
          prismaClient.exerciseOption.create({
            data: {
              exerciseId: exercise.id,
              text: option.text,
              isCorrect: option.isCorrect,
              order: option.order || index + 1,
              imageSrc: option.imageSrc,
              audioSrc: option.audioSrc,
            },
          })
        )
      );
    }

    // Return the complete exercise with options
    return prismaClient.exercise.findUnique({
      where: { id: exercise.id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
        exerciseOptions: {
          orderBy: { order: "asc" },
        },
      },
    });
  });
};

export const updateExercise = async (
  id: number,
  data: UpdateExerciseParams
) => {
  // Check if the exercise exists
  const existingExercise = await prisma.exercise.findUnique({
    where: { id },
  });

  if (!existingExercise) {
    throw new NotFoundError(`Exercise with ID ${id} not found`);
  }

  // Update the exercise and its options in a transaction
  return prisma.$transaction(async (prismaClient) => {
    // Update the base exercise data
    await prismaClient.exercise.update({
      where: { id },
      data: {
        type: data.type as ExerciseType | undefined,
        question: data.question,
        instruction: data.instruction,
        order: data.order,
        xpReward: data.xpReward,
        timeLimit: data.timeLimit,
      },
    });

    // If options are provided, update them
    if (data.options && data.options.length > 0) {
      // First delete existing options
      await prismaClient.exerciseOption.deleteMany({
        where: { exerciseId: id },
      });

      // Then create new options
      await Promise.all(
        data.options.map((option, index) =>
          prismaClient.exerciseOption.create({
            data: {
              exerciseId: id,
              text: option.text,
              isCorrect: option.isCorrect,
              order: option.order || index + 1,
              imageSrc: option.imageSrc,
              audioSrc: option.audioSrc,
            },
          })
        )
      );
    }

    // Return the updated exercise with its options
    return prismaClient.exercise.findUnique({
      where: { id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
        exerciseOptions: {
          orderBy: { order: "asc" },
        },
      },
    });
  });
};

/**
 * Delete an exercise (this will cascade delete its options too)
 */
export const deleteExercise = async (id: number) => {
  // Check if the exercise exists
  const existingExercise = await prisma.exercise.findUnique({
    where: { id },
  });

  if (!existingExercise) {
    throw new NotFoundError(`Exercise with ID ${id} not found`);
  }

  return prisma.exercise.delete({
    where: { id },
  });
};

export const checkAnswer = async (
  id: number,
  answer: string | number | string[],
  userId: any
) => {
  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: {
      exerciseOptions: true,
    },
  });

  if (!exercise) {
    throw new NotFoundError(`Exercise with ID ${id} not found`);
  }

  // Different checking logic based on exercise type
  let isCorrect = false;
  let correctAnswer = "";

  switch (exercise.type) {
    case "MULTIPLE_CHOICE":
      // For multiple choice, answer should be the id of an option
      const selectedOption = exercise.exerciseOptions.find(
        (option) => option.id === Number(answer)
      );
      isCorrect = !!selectedOption?.isCorrect;

      // Find the correct answer for feedback
      const correctOption = exercise.exerciseOptions.find(
        (option) => option.isCorrect
      );
      correctAnswer = correctOption?.text || "";
      break;

    case "FILL_IN_BLANK":
    case "VOCABULARY_CHECK":
      // For text input exercises, compare with correct option
      const correctTextOption = exercise.exerciseOptions.find(
        (option) => option.isCorrect
      );
      correctAnswer = correctTextOption?.text || "";

      // Case insensitive comparison
      if (typeof answer === "string" && correctAnswer) {
        isCorrect =
          answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      }
      break;

    case "SENTENCE_ORDER":
      // For sentence ordering, validate based on correct option
      const correctOrderOption = exercise.exerciseOptions.find(
        (option) => option.isCorrect
      );
      correctAnswer = correctOrderOption?.text || "";

      if (Array.isArray(answer) && typeof answer[0] === "string") {
        // For sentence order, the user submits an array of words/segments
        // We check if the joined result matches the correct answer
        const userAnswer = answer.join(" ").toLowerCase().trim();
        isCorrect = userAnswer === correctAnswer.toLowerCase().trim();
      }
      break;

    default:
      isCorrect = false;
  }

  // Get user data for streak and level calculations
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      streak: true,
      level: true,
      hearts: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Check if this exercise was already completed
  const existingProgress = await prisma.exerciseProgress.findFirst({
    where: {
      userId,
      exerciseId: id,
    },
  });

  const existingUserProgress = await prisma.userProgress.findFirst({
    where: {
      userId,
      lessonId: exercise.lessonId.toString(),
      exerciseId: id.toString(),
    },
  });

  const isNewCompletion =
    isCorrect && (!existingProgress || !existingProgress.completed);

  let newheartcount = user.hearts;
  let heartchange = 0;
  if(!isCorrect && (!existingProgress || !existingProgress.completed)) {
    if(newheartcount >0)
    {
      newheartcount -= 1;
      heartchange = -1;
    }
  }
  else if(isCorrect && (!existingProgress || !existingProgress.completed)) {
    // maximun for each user is 5 so yeah
    // Thien: For now the idea is answer the previous completed questions correctly will regain hearts
    if (newheartcount < 5) {
      newheartcount += 1;
      heartchange = 1;
    }
  }

  // Only increase streak for correct answers on NEW completions
  // This prevents users from farming streak by repeating completed exercises
  let newStreak = user.streak;
  if (isNewCompletion) {
    // Only increment streak for new completions
    newStreak += 1;
  } else if (!isCorrect) {
    // Reset streak for incorrect answers
    newStreak = 0;
  }

  // Calculate XP reward
  const baseXpReward = isCorrect ? exercise.xpReward : 0;
  let streakMultiplier = getStreakMultiplier(newStreak);
  let xpReward = Math.round(baseXpReward * streakMultiplier);

  // No XP for already completed exercises
  let finalXpReward =
    existingProgress && existingProgress.completed ? 0 : xpReward;

  // Calculate level up info based on new XP total
  const newTotalXP = user.xp + finalXpReward;
  const levelUpInfo = isCorrect
    ? checkLevelUp(user.level, newTotalXP)
    : {
        leveledUp: false,
        xpForNextLevel: calculateRequiredXPForLevel(user.level + 1),
      };

  const currentAttempts = (existingUserProgress?.attempts || 0) + 1;
  const score = calculateScore(
    isCorrect,
    currentAttempts,
    exercise.timeLimit ?? undefined
  );
  // Store progress in database
  if (existingProgress) {
    if (!existingProgress.completed && isCorrect) {
      await prisma.exerciseProgress.update({
        where: { id: existingProgress.id },
        data: {
          completed: true,
          completedAt: new Date(),
        },
      });
    }
  } else {
    await prisma.exerciseProgress.create({
      data: {
        exerciseId: id,
        userId,
        completed: isCorrect,
        completedAt: isCorrect ? new Date() : null,
      },
    });

    await prisma.userProgress.upsert({
      where: {
        userId_lessonId_exerciseId: {
          userId,
          lessonId: exercise.lessonId.toString(),
          exerciseId: id.toString(),
        },
      },
      update: {
        attempts: { increment: 1 },
        score: isCorrect ? score : existingUserProgress?.score || 0,
        completed: isCorrect || existingUserProgress?.completed || false,
        completedAt: isCorrect
          ? new Date()
          : existingUserProgress?.completedAt || null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        lessonId: exercise.lessonId.toString(),
        exerciseId: id.toString(),
        attempts: 1,
        score: isCorrect ? score : 0,
        completed: isCorrect,
        completedAt: isCorrect ? new Date() : null,
      },
    });
  }

  // Only update user data if there's a change to make
  if (
    isNewCompletion ||
    !isCorrect ||
    finalXpReward > 0 ||
    levelUpInfo.leveledUp
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: finalXpReward },
        streak: newStreak,
        hearts: newheartcount,
        level: levelUpInfo.leveledUp ? levelUpInfo.newLevel : user.level,
        updatedAt: new Date(),
      },
    });
  }

  let completionMessage = null;
  if (isCorrect) {
    // Only fetch additional data if answer is correct to avoid unnecessary database queries
    const exerciseWithLesson = await prisma.exercise.findUnique({
      where: { id },
      include: { lesson: true },
    });

    if (exerciseWithLesson) {
      // Count total exercises in this lesson
      const totalExercises = await prisma.exercise.count({
        where: { lessonId: exerciseWithLesson.lessonId },
      });

      // Count completed exercises in this lesson
      const completedExercises = await prisma.exerciseProgress.count({
        where: {
          userId,
          completed: true,
          Exercise: {
            lessonId: exerciseWithLesson.lessonId,
          },
        },
      });

      // If all exercises are completed, add completion message
      if (completedExercises >= totalExercises && isNewCompletion) {
        completionMessage = `Congratulations! You've completed all exercises in "${exerciseWithLesson.lesson.title}" lesson. You can now move to the next lesson or practice this one again.`;

        // Trigger achievement evaluation on lesson completion
        const lessonsCompleted = await prisma.userProgress.findMany({
          where: { userId, completed: true },
          select: { lessonId: true },
          distinct: ["lessonId"],
        });

        await achievementsService.evaluateAchievements(userId, {
          lessonsCompleted: lessonsCompleted.length,
          streakDays: newStreak,
          xp: newTotalXP,
          minutes: 0,
        });

        // Create a review item if none exists for this lesson
        const existingReview = await prisma.reviewItem.findFirst({
          where: {
            userId,
            itemType: ReviewItemType.LESSON,
            lessonId: exerciseWithLesson.lessonId,
          },
        });

        if (!existingReview) {
          const dueAt = new Date();
          await prisma.reviewItem.create({
            data: {
              userId,
              itemType: ReviewItemType.LESSON,
              lessonId: exerciseWithLesson.lessonId,
              dueAt,
              intervalDays: 1,
            },
          });
        }

        await prisma.notification.create({
          data: {
            userId,
            title: "Lesson completed!",
            body: `You finished ${exerciseWithLesson.lesson.title}. A review is scheduled for tomorrow.`,
            type: NotificationType.ACHIEVEMENT,
          },
        });

        await auditService.logAudit(userId, AuditAction.PROGRESS_UPDATE, "lesson", {
          lessonId: exerciseWithLesson.lessonId,
          title: exerciseWithLesson.lesson.title,
        });
      }
    }
  }

  return {
    isCorrect,
    xpReward: finalXpReward,
    baseXpReward,
    streakMultiplier: isCorrect ? streakMultiplier : 1,
    currentStreak: newStreak,
    isNewCompletion, // Add flag to indicate if this was a new completion
    levelUp: levelUpInfo,
    correctAnswer,
    feedback: isCorrect ? "Correct!" : "Uh Oh. Try again.",
    completionMessage,
    score: score,
    attempts: currentAttempts,
    hearts: newheartcount,
    heartchange: heartchange,
  };
};

export const getExercisesWithStatus = async (
  lessonId: number,
  userId: string
) => {
  // Get all exercises for the lesson
  const exercises = await prisma.exercise.findMany({
    where: { lessonId },
    orderBy: { order: "asc" },
    include: {
      exerciseOptions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          text: true,
          order: true,
          // Don't include isCorrect to avoid revealing answers
        },
      },
    },
  });

  // Get completion status for each exercise
  const exercisesWithStatus = await Promise.all(
    exercises.map(async (exercise) => {
      const progress = await prisma.exerciseProgress.findFirst({
        where: {
          userId,
          exerciseId: exercise.id,
          completed: true,
        },
      });

      return {
        ...exercise,
        isCompleted: !!progress,
        completedAt: progress?.completedAt || null,
      };
    })
  );

  // Calculate overall lesson completion
  const totalExercises = exercises.length;
  const completedExercises = exercisesWithStatus.filter(
    (e) => e.isCompleted
  ).length;
  const progress = totalExercises > 0 ? completedExercises / totalExercises : 0;
  const isLessonCompleted =
    completedExercises === totalExercises && totalExercises > 0;

  return {
    exercises: exercisesWithStatus,
    progress,
    completedExercises,
    totalExercises,
    isCompleted: isLessonCompleted,
  };
};

export const calculateRequiredXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  if (level === 2) return 50;
  if (level === 3) return 120;
  if (level === 4) return 250;
  if (level === 5) return 370;
  if (level === 6) return 500;

  // Exponential growth for higher levels
  return Math.round(100 * Math.pow(level, 1.8));
};

export const getStreakMultiplier = (streak: number): number => {
  if (streak < 5) return 1;
  if (streak < 11) return 2.5;
  if (streak < 16) return 3;
  return 4;
};

export const checkLevelUp = (
  currentLevel: number,
  totalXP: number
): {
  leveledUp: boolean;
  newLevel?: number;
  xpForNextLevel: number;
} => {
  // Calculate the correct level based on total XP
  const correctLevel = calculateLevelFromXP(totalXP);

  // Check if they leveled up at all
  if (correctLevel > currentLevel) {
    return {
      leveledUp: true,
      newLevel: correctLevel, // Could be multiple levels higher
      xpForNextLevel: calculateRequiredXPForLevel(correctLevel + 1),
    };
  }

  return {
    leveledUp: false,
    xpForNextLevel: calculateRequiredXPForLevel(currentLevel + 1),
  };
};

export const calculateLevelFromXP = (xp: number): number => {
  if (xp < 50) return 1;

  let level = 1;

  // Keep incrementing level until we find the highest level they qualify for
  while (calculateRequiredXPForLevel(level + 1) <= xp) {
    level++;
  }

  return level;
};

const calculateScore = (
  isCorrect: boolean,
  attempts: number,
  timeLimit?: number,
  timeTaken?: number
): number => {
  if (!isCorrect) return 0;

  let baseScore = 100;

  const attemptPenalty = Math.max(0, (attempts - 1) * 20);

  let timeBonus = 0;
  if (timeLimit && timeTaken) {
    const timeRatio = Math.max(0, (timeLimit - timeTaken) / timeLimit);
    timeBonus = Math.round(timeRatio * 20);
  }

  return Math.max(10, baseScore - attemptPenalty + timeBonus);
};
