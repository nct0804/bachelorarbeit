import * as exercisesService from "../../src/modules/exercises/exercises.service";
import { PrismaClient, ExerciseType } from "@prisma/client";
import { NotFoundError } from "../../src/utils/errors";

// Mock Prisma
jest.mock("@prisma/client", () => {
  // Define type for mock client to avoid implicit any
  const mockPrismaClient: Record<string, any> = {
    exercise: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(), // Added count method
    },
    exerciseOption: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(), // Added create method for individual options
      deleteMany: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
    exerciseProgress: {
      // Added missing exerciseProgress object
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    userProgress: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    // Add proper return type for $transaction
    $transaction: jest.fn(<T>(callback: (prisma: any) => Promise<T>) =>
      callback(mockPrismaClient)
    ),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    ExerciseType: {
      MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
      FILL_IN_BLANK: "FILL_IN_BLANK",
      SENTENCE_ORDER: "SENTENCE_ORDER",
      PRONUNCIATION: "PRONUNCIATION",
      VOCABULARY_CHECK: "VOCABULARY_CHECK",
    },
  };
});

describe("Exercises Service", () => {
  const mockPrisma = new PrismaClient();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findExercises", () => {
    it("should return exercises filtered by lessonId", async () => {
      // Arrange
      const lessonId = 1;
      const mockExercises = [
        {
          id: 1,
          type: ExerciseType.MULTIPLE_CHOICE,
          question: 'What is "hello" in German?',
          lessonId,
        },
        {
          id: 2,
          type: ExerciseType.FILL_IN_BLANK,
          question: "Complete: Guten ___ (day)",
          lessonId,
        },
      ];

      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(
        mockExercises
      );

      // Act
      const result = await exercisesService.findExercises({ lessonId });

      // Assert
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith({
        where: { lessonId },
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

      expect(result).toEqual(mockExercises);
    });

    it("should filter exercises by type", async () => {
      // Arrange
      const type = ExerciseType.MULTIPLE_CHOICE;
      const mockExercises = [
        {
          id: 1,
          type,
          question: 'What is "hello" in German?',
          lessonId: 1,
        },
        {
          id: 3,
          type,
          question: 'What is "thank you" in German?',
          lessonId: 2,
        },
      ];

      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(
        mockExercises
      );

      // Act
      const result = await exercisesService.findExercises({ type });

      // Assert
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith({
        where: { type },
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

      expect(result).toEqual(mockExercises);
    });
  });

  describe("findExerciseById", () => {
    it("should return an exercise by ID with options", async () => {
      // Arrange
      const exerciseId = 1;
      const mockExercise = {
        id: exerciseId,
        type: ExerciseType.MULTIPLE_CHOICE,
        question: 'What is "hello" in German?',
        lessonId: 1,
        options: [
          { id: 1, text: "Hallo", isCorrect: true },
          { id: 2, text: "Tschüss", isCorrect: false },
        ],
      };

      (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(
        mockExercise
      );

      // Act
      const result = await exercisesService.findExerciseById(exerciseId);

      // Assert
      expect(mockPrisma.exercise.findUnique).toHaveBeenCalledWith({
        where: { id: exerciseId },
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

      expect(result).toEqual(mockExercise);
    });

    it("should throw NotFoundError if exercise does not exist", async () => {
      // Arrange
      const exerciseId = 999;
      (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        exercisesService.findExerciseById(exerciseId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("checkAnswer", () => {
    it("should correctly check multiple choice answer and award XP", async () => {
      // Arrange
      const exerciseId = 1;
      const answer = "2"; // ID of the option
      const userId = "user-123";

      const mockExercise = {
        id: exerciseId,
        type: ExerciseType.MULTIPLE_CHOICE,
        xpReward: 5,
        lessonId: 1,
        exerciseOptions: [
          { id: 1, text: "Wrong option", isCorrect: false },
          { id: 2, text: "Correct option", isCorrect: true },
        ],
        lesson: { title: "Test Lesson" }, // Add lesson property for completion message
      };

      const mockUser = {
        id: userId,
        xp: 100,
        streak: 1,
        level: 1,
      };

      // Mock service responses
      (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(
        mockExercise
      );
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.exerciseProgress.findFirst as jest.Mock).mockResolvedValue(
        null
      ); // No existing progress
      (mockPrisma.exerciseProgress.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        xp: 105,
      });
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.exerciseProgress.count as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await exercisesService.checkAnswer(
        exerciseId,
        answer,
        userId
      );

      // Assert
      expect(mockPrisma.exercise.findUnique).toHaveBeenCalledWith({
        where: { id: exerciseId },
        include: {
          exerciseOptions: true,
        },
      });

      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.exerciseProgress.create).toHaveBeenCalled();

      // Update the expected structure to match actual implementation
      expect(result).toMatchObject({
        isCorrect: true,
        correctAnswer: "Correct option",
        xpReward: 5,
        feedback: "Correct!",
      });
    });

    it("should handle incorrect answers", async () => {
      // Arrange
      const exerciseId = 1;
      const answer = "1"; // Wrong option ID
      const userId = "user-123";

      const mockExercise = {
        id: exerciseId,
        type: ExerciseType.MULTIPLE_CHOICE,
        xpReward: 5,
        lessonId: 1,
        exerciseOptions: [
          { id: 1, text: "Wrong option", isCorrect: false },
          { id: 2, text: "Correct option", isCorrect: true },
        ],
      };

      const mockUser = {
        id: userId,
        xp: 100,
        streak: 1,
        level: 1,
      };

      (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(
        mockExercise
      );
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.exerciseProgress.findFirst as jest.Mock).mockResolvedValue(
        null
      );
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        streak: 0,
      });

      // Act
      const result = await exercisesService.checkAnswer(
        exerciseId,
        answer,
        userId
      );

      // Assert
      // Update the expected structure to match actual implementation
      expect(result).toMatchObject({
        isCorrect: false,
        correctAnswer: "Correct option",
        xpReward: 0,
        feedback: "Uh Oh. Try again.",
      });
    });
  });

  describe("createExercise", () => {
    it("should create exercise with options", async () => {
      // Arrange
      const exerciseData = {
        lessonId: 1,
        type: ExerciseType.MULTIPLE_CHOICE,
        question: 'What is "goodbye" in German?',
        instruction: "Choose the correct translation",
        order: 2,
        xpReward: 5,
        options: [
          { text: "Hallo", isCorrect: false, order: 1 },
          { text: "Tschüss", isCorrect: true, order: 2 },
        ],
      };

      const mockLesson = { id: 1 };

      const mockCreatedExercise = {
        id: 3,
        lessonId: 1,
        type: ExerciseType.MULTIPLE_CHOICE,
        question: 'What is "goodbye" in German?',
        instruction: "Choose the correct translation",
        order: 2,
        xpReward: 5,
        createdAt: new Date(),
      };

      // Mock the lesson check
      (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);

      // Mock the exercise creation
      (mockPrisma.exercise.create as jest.Mock).mockResolvedValue(
        mockCreatedExercise
      );

      // Mock option creation
      (mockPrisma.exerciseOption.create as jest.Mock).mockImplementation(
        (data) => {
          return Promise.resolve({
            id: data.data.order, // use order as id for simplicity
            ...data.data,
          });
        }
      );

      // Mock the final exercise fetch with options
      (mockPrisma.exercise.findUnique as jest.Mock)
        .mockImplementationOnce(() => mockCreatedExercise)
        .mockImplementationOnce(() => ({
          ...mockCreatedExercise,
          lesson: { id: 1, title: "Test Lesson" },
          exerciseOptions: [
            { id: 1, text: "Hallo", isCorrect: false, order: 1 },
            { id: 2, text: "Tschüss", isCorrect: true, order: 2 },
          ],
        }));

      // Act
      const result = await exercisesService.createExercise(exerciseData);

      // Assert
      expect(mockPrisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: exerciseData.lessonId },
      });

      expect(mockPrisma.exercise.create).toHaveBeenCalled();
      expect(mockPrisma.exerciseOption.create).toHaveBeenCalled();

      expect(result).toMatchObject({
        id: expect.any(Number),
        question: 'What is "goodbye" in German?',
      });
    });

    it("should throw NotFoundError if lesson does not exist", async () => {
      // Arrange
      const exerciseData = {
        lessonId: 999,
        type: ExerciseType.MULTIPLE_CHOICE,
        question: "Test question",
        options: [],
        order: 1, // Add the required 'order' property
      };

      (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        exercisesService.createExercise(exerciseData)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getExercisesWithStatus", () => {
    it("should return exercises with completion status", async () => {
      // Arrange
      const lessonId = 1;
      const userId = "user-123";

      const mockExercises = [
        { id: 1, question: "Question 1" },
        { id: 2, question: "Question 2" },
      ];

      // Mock exercise.findMany to return our test exercises
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(
        mockExercises
      );

      // THIS IS THE KEY CHANGE:
      // Mock exerciseProgress.findFirst to return different values based on exercise ID
      // The actual implementation calls findFirst for EACH exercise
      (mockPrisma.exerciseProgress.findFirst as jest.Mock).mockImplementation(
        ({ where }) => {
          if (
            where.exerciseId === 1 &&
            where.userId === userId &&
            where.completed === true
          ) {
            // First exercise is completed
            return Promise.resolve({ completedAt: new Date() });
          }
          // Second exercise is not completed
          return Promise.resolve(null);
        }
      );
      // Act
      const result = await exercisesService.getExercisesWithStatus(
        lessonId,
        userId
      );

      // Assert
      // Update to match what the implementation actually expects
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { lessonId },
          orderBy: { order: "asc" },
          include: expect.objectContaining({
            exerciseOptions: expect.objectContaining({
              orderBy: { order: "asc" },
            }),
          }),
        })
      );

      expect(result).toMatchObject({
        exercises: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            question: "Question 1",
            isCompleted: true,
          }),
          expect.objectContaining({
            id: 2,
            question: "Question 2",
            isCompleted: false,
          }),
        ]),
        progress: 0.5,
        completedExercises: 1,
        totalExercises: 2,
      });
    });
  });
});
