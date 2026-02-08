import * as coursesService from '../../src/modules/courses/courses.service';
import { PrismaClient, LanguageLevel } from '@prisma/client';
import { NotFoundError } from '../../src/utils/errors';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    course: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    module: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    userProgress: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    exerciseProgress: {
      findMany: jest.fn(),
      count: jest.fn()
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    LanguageLevel: {
      A1_1: 'A1_1',
      A1_2: 'A1_2',
      A2_1: 'A2_1',
      A2_2: 'A2_2'
    }
  };
});

describe('Courses Service', () => {
  const mockPrisma = new PrismaClient();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('findCourses', () => {
    it('should return all courses', async () => {
      // Arrange
      const mockCourses = [
        {
          id: 1,
          title: 'German A1.1',
          description: 'Beginner German course',
          level: LanguageLevel.A1_1,
          imageSrc: 'image1.jpg',
          order: 1,
          isLocked: false,
          createdAt: new Date()
        },
        {
          id: 2,
          title: 'German A1.2',
          description: 'Beginner German continuation',
          level: LanguageLevel.A1_2,
          imageSrc: 'image2.jpg',
          order: 2,
          isLocked: true,
          createdAt: new Date()
        }
      ];
      
      (mockPrisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      
      // Act
      const result = await coursesService.findCourses();
      
      // Assert
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { order: 'asc' },
        include: {
          modules: {
            select: {
              id: true,
              title: true,
              order: true,
              isLocked: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });
      
      expect(result).toEqual(mockCourses);
    });
  });
  
  describe('findCourseById', () => {
    it('should return a course by ID', async () => {
      // Arrange
      const courseId = 1;
      const mockCourse = {
        id: courseId,
        title: 'German A1.1',
        description: 'Beginner German course',
        level: LanguageLevel.A1_1,
        imageSrc: 'image1.jpg',
        order: 1,
        isLocked: false,
        createdAt: new Date()
      };
      
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      
      // Act
      const result = await coursesService.findCourseById(courseId);
      
      // Assert
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: courseId },
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  title: true,
                  order: true
                }
              }
            }
          }
        }
      });
      
      expect(result).toEqual(mockCourse);
    });
    
    it('should throw NotFoundError if course does not exist', async () => {
      // Arrange
      const courseId = 999;
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(coursesService.findCourseById(courseId))
        .rejects
        .toThrow(NotFoundError);
    });
  });
  
  describe('createCourse', () => {
    it('should create and return a new course', async () => {
      // Arrange
      const courseData = {
        title: 'German A2.1',
        description: 'Intermediate German course',
        level: LanguageLevel.A2_1,
        imageSrc: 'image3.jpg',
        order: 3
      };
      
      const mockCreatedCourse = {
        id: 3,
        ...courseData,
        isActive: true,
        createdAt: new Date()
      };
      
      (mockPrisma.course.create as jest.Mock).mockResolvedValue(mockCreatedCourse);
      
      // Act
      const result = await coursesService.createCourse(courseData);
      
      // Assert
      expect(mockPrisma.course.create).toHaveBeenCalledWith({
        data: {
          title: courseData.title,
          description: courseData.description,
          level: courseData.level as any,
          imageSrc: courseData.imageSrc || '',
          order: courseData.order
        }
      });
      
      expect(result).toEqual(mockCreatedCourse);
    });
  });
  
  describe('updateCourse', () => {
    it('should update and return a course', async () => {
      // Arrange
      const courseId = 1;
      const updateData = {
        title: 'Updated Course Title',
        description: 'Updated course description'
      };
      
      const mockUpdatedCourse = {
        id: courseId,
        title: 'Updated Course Title',
        description: 'Updated course description',
        level: LanguageLevel.A1_1,
        imageSrc: 'image1.jpg',
        order: 1,
        isLocked: false,
        createdAt: new Date()
      };
      
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({ id: courseId });
      (mockPrisma.course.update as jest.Mock).mockResolvedValue(mockUpdatedCourse);
      
      // Act
      const result = await coursesService.updateCourse(courseId, updateData);
      
      // Assert
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: courseId }
      });
      
      expect(mockPrisma.course.update).toHaveBeenCalledWith({
        where: { id: courseId },
        data: {
          ...updateData,
          level: undefined
        }
      });
      
      expect(result).toEqual(mockUpdatedCourse);
    });
    
    it('should throw NotFoundError if course does not exist', async () => {
      // Arrange
      const courseId = 999;
      const updateData = { title: 'Updated Title' };
      
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(coursesService.updateCourse(courseId, updateData))
        .rejects
        .toThrow(NotFoundError);
    });
  });
  
  describe('deleteCourse', () => {
    it('should delete and return a course', async () => {
      // Arrange
      const courseId = 1;
      const mockDeletedCourse = {
        id: courseId,
        title: 'German A1.1',
        description: 'Beginner German course',
        level: LanguageLevel.A1_1
      };
      
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({ id: courseId });
      (mockPrisma.course.delete as jest.Mock).mockResolvedValue(mockDeletedCourse);
      
      // Act
      const result = await coursesService.deleteCourse(courseId);
      
      // Assert
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: courseId }
      });
      
      expect(mockPrisma.course.delete).toHaveBeenCalledWith({
        where: { id: courseId }
      });
      
      expect(result).toEqual(mockDeletedCourse);
    });
    
    it('should throw NotFoundError if course does not exist', async () => {
      // Arrange
      const courseId = 999;
      
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(coursesService.deleteCourse(courseId))
        .rejects
        .toThrow(NotFoundError);
    });
  });
  
  describe('getCourseProgress', () => {
    it('should return progress for a specific course', async () => {
      // Arrange
      const courseId = 1;
      const userId = 'user-123';
      
      const mockCourse = {
        id: courseId,
        title: 'German A1.1',
        description: 'Beginner German course',
        level: LanguageLevel.A1_1,
        imageSrc: 'image1.jpg',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        modules: [
          {
            id: 1, 
            title: 'Module 1',
            lessons: [
              {
                id: 1,
                title: 'Lesson 1',
                exercises: [
                  { id: 1 },
                  { id: 2 }
                ]
              }
            ]
          }
        ]
      };

      const mockUserProgress = [
        { exerciseId: 1 }
      ];
      
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (mockPrisma.exerciseProgress.findMany as jest.Mock).mockResolvedValue(mockUserProgress);
      
      // Act
      const result = await coursesService.getCourseWithProgress(courseId, userId);
      
      // Assert
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: courseId },
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                include: {
                  exercises: true
                }
              }
            }
          }
        }
      });

      expect(mockPrisma.exerciseProgress.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          completed: true,
          Exercise: {
            lesson: {
              module: {
                courseId: courseId
              }
            }
          }
        }
      });
      
      expect(result).toEqual(expect.objectContaining({
        progress: 0.5, // 1 completed out of 2 = 50%
        completedExercises: 1,
        totalExercises: 2
      }));
    });
    
    it('should throw NotFoundError if course does not exist', async () => {
      // Arrange
      const courseId = 999;
      const userId = 'user-123';
      
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(coursesService.getCourseWithProgress(courseId, userId))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});