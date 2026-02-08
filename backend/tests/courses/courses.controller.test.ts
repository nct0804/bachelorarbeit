import { Request, Response } from "express";
import * as coursesService from "../../src/modules/courses/courses.service";
import * as coursesController from "../../src/modules/courses/courses.controller";
import { BadRequestError, NotFoundError } from "../../src/utils/errors";
import { LanguageLevel } from "@prisma/client";
import { AuthRequest } from "../../src/middleware/auth.middleware";

// Mock the courses service
jest.mock("../../src/modules/courses/courses.service");

describe("Courses Controller", () => {
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
    hearts: 5, // Assuming hearts is a property of the user
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create a mock admin user
  const mockAdminUser = {
    ...mockUser,
    id: "admin-123",
    hearts: 10, // Admin might have more hearts
  };

  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: mockUser,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("getAllCourses", () => {
    it("should return all courses", async () => {
      // Arrange
      const mockCourses = [
        {
          id: 1,
          title: "German A1.1",
          description: "Beginner German course",
          level: LanguageLevel.A1_1,
          imageSrc: "image1.jpg",
          order: 1,
          isLocked: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          title: "German A1.2",
          description: "Beginner German continuation",
          level: LanguageLevel.A1_2,
          imageSrc: "image2.jpg",
          order: 2,
          isLocked: true,
          createdAt: new Date(),
        },
      ];

      (coursesService.findCourses as jest.Mock).mockResolvedValue(mockCourses);

      // Act
      await coursesController.getAllCourses(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(coursesService.findCourses).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCourses,
      });
    });
  });

  describe("getCourseById", () => {
    it("should return a specific course by ID", async () => {
      // Arrange
      const courseId = "1";
      mockRequest.params = { id: courseId };

      const mockCourse = {
        id: 1,
        title: "German A1.1",
        description: "Beginner German course",
        level: LanguageLevel.A1_1,
        imageSrc: "image1.jpg",
        order: 1,
        isLocked: false,
        createdAt: new Date(),
      };

      (coursesService.findCourseById as jest.Mock).mockResolvedValue(
        mockCourse
      );

      // Act
      await coursesController.getCourseById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(coursesService.findCourseById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCourse,
      });
    });

    it("should handle invalid course ID", async () => {
      // Arrange
      mockRequest.params = { id: "invalid" };

      // Act & Assert
      await expect(
        coursesController.getCourseById(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(BadRequestError);
    });

    it("should handle course not found", async () => {
      // Arrange
      mockRequest.params = { id: "999" };

      (coursesService.findCourseById as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Course not found");
      });

      // Act & Assert
      await expect(
        coursesController.getCourseById(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("createCourse", () => {
    it("should create a new course for admin user", async () => {
      // Arrange
      const courseData = {
        title: "German A2.1",
        description: "Intermediate German course",
        level: LanguageLevel.A2_1,
        imageSrc: "image3.jpg",
        order: 3,
      };

      mockRequest.body = courseData;
      mockRequest.user = mockAdminUser;

      const mockCreatedCourse = {
        id: 3,
        ...courseData,
        isLocked: true,
        createdAt: new Date(),
      };

      (coursesService.createCourse as jest.Mock).mockResolvedValue(
        mockCreatedCourse
      );

      // Act
      await coursesController.createCourse(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      // Assert
      expect(coursesService.createCourse).toHaveBeenCalledWith(courseData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedCourse,
      });
    });
  });

  describe("updateCourse", () => {
    it("should update an existing course for admin user", async () => {
      // Arrange
      const courseId = "1";
      const updateData = {
        title: "Updated Course Title",
        description: "Updated course description",
      };

      mockRequest.params = { id: courseId };
      mockRequest.body = updateData;
      mockRequest.user = mockAdminUser;

      const mockUpdatedCourse = {
        id: 1,
        title: "Updated Course Title",
        description: "Updated course description",
        level: LanguageLevel.A1_1,
        imageSrc: "image1.jpg",
        order: 1,
        isLocked: false,
        createdAt: new Date(),
      };

      (coursesService.updateCourse as jest.Mock).mockResolvedValue(
        mockUpdatedCourse
      );

      // Act
      await coursesController.updateCourse(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      // Assert
      expect(coursesService.updateCourse).toHaveBeenCalledWith(1, updateData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedCourse,
      });
    });
  });

  describe("deleteCourse", () => {
    it("should delete a course for admin user", async () => {
      // Arrange
      const courseId = "1";
      mockRequest.params = { id: courseId };
      mockRequest.user = mockAdminUser;

      const mockDeletedCourse = {
        id: 1,
        title: "German A1.1",
        description: "Beginner German course",
        level: LanguageLevel.A1_1,
      };

      (coursesService.deleteCourse as jest.Mock).mockResolvedValue(
        mockDeletedCourse
      );

      // Act
      await coursesController.deleteCourse(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      // Assert
      expect(coursesService.deleteCourse).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: `Course with ID ${courseId} successfully deleted`,
        data: mockDeletedCourse,
      });
    });
  });

  describe("getCourseWithProgress", () => {
    it("should return progress for a specific course", async () => {
      // Arrange
      const courseId = "1";
      mockRequest.params = { id: courseId };
      mockRequest.user = mockUser;

      const mockProgress = {
        progress: 45,
        completedExercises: 27,
        totalExercises: 60,
        isCompleted: false,
        status: "in-progress",
        actionLabel: "CONTINUE",
      };

      (coursesService.getCourseWithProgress as jest.Mock).mockResolvedValue(
        mockProgress
      );

      // Act
      await coursesController.getCourseWithProgress(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      // Assert
      expect(coursesService.getCourseWithProgress).toHaveBeenCalledWith(
        1,
        "user-123"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockProgress,
      });
    });
  });

  describe("getAllCoursesWithProgress", () => {
    it("should return all courses with progress info", async () => {
      // Arrange
      mockRequest.user = mockUser;

      const mockCoursesWithProgress = [
        {
          id: 1,
          title: "German A1.1",
          progress: 75,
          status: "in-progress",
          actionLabel: "CONTINUE",
        },
        {
          id: 2,
          title: "German A1.2",
          progress: 0,
          status: "locked",
          actionLabel: "LOCKED",
        },
      ];

      (coursesService.getAllCoursesWithProgress as jest.Mock).mockResolvedValue(
        mockCoursesWithProgress
      );

      // Act
      await coursesController.getAllCoursesWithProgress(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      // Assert
      expect(coursesService.getAllCoursesWithProgress).toHaveBeenCalledWith(
        "user-123"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCoursesWithProgress,
      });
    });
  });
});
