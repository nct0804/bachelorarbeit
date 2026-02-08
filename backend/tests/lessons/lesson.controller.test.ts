import { Request, Response } from 'express';
import * as lessonService from '../../src/modules/lessons/lessons.service';
import * as lessonController from '../../src/modules/lessons/lessons.controller';
import { BadRequestError, NotFoundError } from '../../src/utils/errors';

// Mock the lesson service
jest.mock('../../src/modules/lessons/lessons.service');

describe('Lesson Controller', () => {
  // Setup mock request and response
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      body: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllLessons', () => {
    it('should return lessons filtered by moduleId', async () => {
      // Arrange
      const moduleId = '5';
      mockRequest.query = { moduleId };
      
      const mockLessons = [
        { id: 1, title: 'Lesson 1', moduleId: 5 },
        { id: 2, title: 'Lesson 2', moduleId: 5 }
      ];
      
      (lessonService.findLessons as jest.Mock).mockResolvedValue(mockLessons);
      
      // Act
      await lessonController.getAllLessons(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(lessonService.findLessons).toHaveBeenCalledWith({
        moduleId: 5
      });
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      // Updated from status to success
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockLessons
      });
    });
  });

  describe('getLessonById', () => {
    it('should return a specific lesson by ID', async () => {
      // Arrange
      const lessonId = '1';
      mockRequest.params = { id: lessonId };
      
      const mockLesson = { id: 1, title: 'Lesson 1', moduleId: 5 };
      (lessonService.findLessonById as jest.Mock).mockResolvedValue(mockLesson);
      
      // Act
      await lessonController.getLessonById(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(lessonService.findLessonById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      // Updated from status to success
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockLesson
      });
    });
    
    it('should handle invalid lesson ID', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid' };
      
      // Act & Assert
      await expect(
        lessonController.getLessonById(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(BadRequestError);
    });
    
    it('should handle lesson not found', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      
      (lessonService.findLessonById as jest.Mock).mockImplementation(() => {
        throw new NotFoundError('Lesson not found');
      });
      
      // Act & Assert
      await expect(
        lessonController.getLessonById(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('createLesson', () => {
    it('should create a new lesson', async () => {
      // Arrange
      const lessonData = { 
        title: 'New Lesson', 
        moduleId: 5,
        order: 1
      };
      mockRequest.body = lessonData;
      
      const mockCreatedLesson = { 
        id: 3, 
        ...lessonData
      };
      
      (lessonService.createLesson as jest.Mock).mockResolvedValue(mockCreatedLesson);
      
      // Act
      await lessonController.createLesson(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(lessonService.createLesson).toHaveBeenCalledWith(lessonData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      // Updated from status to success
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedLesson
      });
    });
  });
});