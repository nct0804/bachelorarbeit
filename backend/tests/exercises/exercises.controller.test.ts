import { Request, Response } from "express";
import * as exercisesService from "../../src/modules/exercises/exercises.service";
import * as exercisesController from "../../src/modules/exercises/exercises.controller";
import { BadRequestError, NotFoundError } from "../../src/utils/errors";
import { ExerciseType } from "@prisma/client";
import { AuthRequest } from "../../src/middleware/auth.middleware";

// Mock the exercises service
jest.mock("../../src/modules/exercises/exercises.service");

describe("Exercises Controller", () => {
  // Setup mock request and response
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  // Create a complete mock user object with all required properties
  const mockUser = {
    id: "user-123",
    clerkId: null,
    email: "test@example.com",
    username: "testuser",
    password: "hashedpassword",
    firstName: "Test",
    lastName: "User",
    level: 1,
    xp: 0,
    streak: 0,
    hearts: 5,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: mockUser, // Use the complete mock user object
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("getAllExercises", () => {
    it("should return all exercises", async () => {
      // Arrange
      const mockExercises = [
        {
          id: 1,
          type: ExerciseType.MULTIPLE_CHOICE,
          question: 'What is "hello" in German?',
          lessonId: 1,
        },
        {
          id: 2,
          type: ExerciseType.FILL_IN_BLANK,
          question: "Complete: Guten ___ (day)",
          lessonId: 2,
        },
      ];

      (exercisesService.findExercises as jest.Mock).mockResolvedValue(
        mockExercises
      );

      // Act
      await exercisesController.getAllExercises(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(exercisesService.findExercises).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockExercises,
      });
    });

    it("should filter exercises by lessonId", async () => {
      // Arrange
      mockRequest.query = { lessonId: "1" };

      const mockExercises = [
        {
          id: 1,
          type: ExerciseType.MULTIPLE_CHOICE,
          question: 'What is "hello" in German?',
          lessonId: 1,
        },
      ];

      (exercisesService.findExercises as jest.Mock).mockResolvedValue(
        mockExercises
      );

      // Act
      await exercisesController.getAllExercises(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(exercisesService.findExercises).toHaveBeenCalledWith({
        lessonId: 1,
        type: undefined,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockExercises,
      });
    });
  });

  describe("getExerciseById", () => {
    it("should return a specific exercise by ID", async () => {
      // Arrange
      const exerciseId = "1";
      mockRequest.params = { id: exerciseId };

      const mockExercise = {
        id: 1,
        type: ExerciseType.MULTIPLE_CHOICE,
        question: 'What is "hello" in German?',
        lessonId: 1,
        options: [
          { id: 1, text: "Hallo", isCorrect: true },
          { id: 2, text: "Tschüss", isCorrect: false },
        ],
      };

      (exercisesService.findExerciseById as jest.Mock).mockResolvedValue(
        mockExercise
      );

      // Act
      await exercisesController.getExerciseById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(exercisesService.findExerciseById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockExercise,
      });
    });

    it("should handle invalid exercise ID", async () => {
      // Arrange
      mockRequest.params = { id: "invalid" };

      // Act & Assert
      await expect(
        exercisesController.getExerciseById(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);
    });

    it("should handle exercise not found", async () => {
      // Arrange
      mockRequest.params = { id: "999" };

      (exercisesService.findExerciseById as jest.Mock).mockImplementation(
        () => {
          throw new NotFoundError("Exercise not found");
        }
      );

      // Act & Assert
      await expect(
        exercisesController.getExerciseById(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("checkExerciseAnswer", () => {
    it("should check answer and return result", async () => {
      // Arrange
      const exerciseId = "1";
      const answer = "1"; // ID of the option

      mockRequest.params = { id: exerciseId };
      mockRequest.body = { answer };
      mockRequest.user = mockUser; // Use the complete mock user

      const mockResult = {
        isCorrect: true,
        correctAnswer: "Hallo",
        xpGained: 10,
        feedback: "Great job!",
      };

      (exercisesService.checkAnswer as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await exercisesController.checkExerciseAnswer(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      // Assert
      expect(exercisesService.checkAnswer).toHaveBeenCalledWith(
        1,
        answer,
        "user-123"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it("should handle missing user ID", async () => {
      // Arrange
      mockRequest.params = { id: "1" };
      mockRequest.body = { answer: "1" };
      mockRequest.user = undefined;

      // Act & Assert
      await expect(
        exercisesController.checkExerciseAnswer(
          mockRequest as AuthRequest,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("createExercise", () => {
    it("should create a new exercise", async () => {
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

      mockRequest.body = exerciseData;

      const mockCreatedExercise = {
        id: 3,
        ...exerciseData,
      };

      (exercisesService.createExercise as jest.Mock).mockResolvedValue(
        mockCreatedExercise
      );

      // Act
      await exercisesController.createExercise(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(exercisesService.createExercise).toHaveBeenCalledWith(
        exerciseData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedExercise,
      });
    });
  });

  describe("updateExercise", () => {
    it("should update an existing exercise", async () => {
      // Arrange
      const exerciseId = "1";
      const updateData = {
        question: "Updated question",
        order: 3,
      };

      mockRequest.params = { id: exerciseId };
      mockRequest.body = updateData;

      const mockUpdatedExercise = {
        id: 1,
        lessonId: 1,
        type: ExerciseType.MULTIPLE_CHOICE,
        question: "Updated question",
        order: 3,
      };

      (exercisesService.updateExercise as jest.Mock).mockResolvedValue(
        mockUpdatedExercise
      );

      // Act
      await exercisesController.updateExercise(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(exercisesService.updateExercise).toHaveBeenCalledWith(
        1,
        updateData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedExercise,
      });
    });
  });

  describe("deleteExercise", () => {
    it("should delete an exercise", async () => {
      // Arrange
      const exerciseId = "1";
      mockRequest.params = { id: exerciseId };

      (exercisesService.deleteExercise as jest.Mock).mockResolvedValue({
        id: 1,
      });

      // Act
      await exercisesController.deleteExercise(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(exercisesService.deleteExercise).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe("getExercisesByLessonId", () => {
    it("should return exercises with completion status", async () => {
      // Arrange
      const lessonId = "1";
      mockRequest.params = { lessonId };
      mockRequest.user = mockUser; // Use the complete mock user

      const mockExercises = [
        { id: 1, question: "Question 1", isCompleted: false },
        { id: 2, question: "Question 2", isCompleted: true },
      ];

      (exercisesService.findExercises as jest.Mock).mockResolvedValue(
        mockExercises
      );

      // Act
      await exercisesController.getExercisesByLessonId(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      // Assert
      expect(exercisesService.findExercises).toHaveBeenCalledWith({
        lessonId: 1,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockExercises,
      });
    });
  });
});
