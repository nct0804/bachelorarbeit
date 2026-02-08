import { Request, Response } from 'express';
import { BadRequestError } from '../../src/utils/errors';
import * as ModuleController from '../../src/modules/modules/modules.controller';
import * as ModuleService from '../../src/modules/modules/modules.service';
import { LanguageLevel } from '@prisma/client';

// Mock the ModuleService
jest.mock('../../src/modules/modules/modules.service');
const mockedModuleService = ModuleService as jest.Mocked<typeof ModuleService>;

describe('ModuleController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    describe('getAllModules', () => {
        it('should return all modules without courseId filter', async () => {
            // Updated mock to match expected return type
            const mockModules = [
                {
                    id: 1, 
                    title: 'Module 1', 
                    courseId: 1,
                    description: 'Description 1',
                    order: 1,
                    requiredXP: 0,
                    xpReward: 10,
                    estimatedTime: 30,
                    isLocked: false,
                    createdAt: new Date(),
                    course: { 
                        id: 1, 
                        title: 'Course 1',
                        level: LanguageLevel.A1_1
                    },
                    _count: {
                        lessons: 2
                    }
                },
                {
                    id: 2, 
                    title: 'Module 2', 
                    courseId: 1,
                    description: 'Description 2',
                    order: 2,
                    requiredXP: 10,
                    xpReward: 15,
                    estimatedTime: 45,
                    isLocked: false,
                    createdAt: new Date(),
                    course: { 
                        id: 1, 
                        title: 'Course 1',
                        level: LanguageLevel.A1_1
                    },
                    _count: {
                        lessons: 3
                    }
                }
            ];
            
            mockRequest.query = {};
            mockedModuleService.findModules.mockResolvedValue(mockModules);

            await ModuleController.getAllModules(mockRequest as Request, mockResponse as Response);

            expect(mockedModuleService.findModules).toHaveBeenCalledWith({ courseId: undefined });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockModules
            });
        });

        it('should return modules filtered by courseId', async () => {
            // Updated mock to match expected return type
            const mockModules = [
                {
                    id: 1, 
                    title: 'Module 1', 
                    courseId: 1,
                    description: 'Description 1',
                    order: 1,
                    requiredXP: 0,
                    xpReward: 10,
                    estimatedTime: 30,
                    isLocked: false,
                    createdAt: new Date(),
                    course: { 
                        id: 1, 
                        title: 'Course 1',
                        level: LanguageLevel.A1_1
                    },
                    _count: {
                        lessons: 2
                    }
                }
            ];
            
            mockRequest.query = { courseId: '1' };
            mockedModuleService.findModules.mockResolvedValue(mockModules);

            await ModuleController.getAllModules(mockRequest as Request, mockResponse as Response);

            expect(mockedModuleService.findModules).toHaveBeenCalledWith({ courseId: 1 });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockModules
            });
        });
    });

    describe('getModuleById', () => {
        it('should return module by valid ID', async () => {
            // Updated mock to match expected return type
            const mockModule = {
                id: 1, 
                title: 'Module 1', 
                courseId: 1,
                description: 'Description 1',
                order: 1,
                requiredXP: 0,
                xpReward: 10,
                estimatedTime: 30,
                isLocked: false,
                createdAt: new Date(),
                course: { 
                    id: 1, 
                    title: 'Course 1',
                    level: LanguageLevel.A1_1
                },
                lessons: [
                    {
                        id: 1,
                        title: 'Lesson 1',
                        description: 'Lesson Description 1',
                        order: 1,
                        xpReward: 5,
                        estimatedTime: 15,
                        createdAt: new Date(),
                        moduleId: 1,
                        _count: {
                            exercises: 3
                        }
                    }
                ]
            };
            
            mockRequest.params = { id: '1' };
            mockedModuleService.findModuleById.mockResolvedValue(mockModule);

            await ModuleController.getModuleById(mockRequest as Request, mockResponse as Response);

            expect(mockedModuleService.findModuleById).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockModule
            });
        });

        it('should throw BadRequestError for invalid ID', async () => {
            mockRequest.params = { id: 'invalid' };

            await expect(
                ModuleController.getModuleById(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow(BadRequestError);
        });
    });

    describe('createModule', () => {
        it('should create new module successfully', async () => {
            const moduleData = {
                courseId: 1,
                title: 'New Module',
                description: 'Module description',
                order: 1,
                isLocked: false
            };
            // Updated mock to match expected return type
            const mockCreatedModule = {
                id: 1,
                ...moduleData,
                requiredXP: 0,
                xpReward: 10,
                estimatedTime: null,
                createdAt: new Date(),
                course: {
                    id: 1,
                    title: 'Course 1'
                }
            };
            
            mockRequest.body = moduleData;
            mockedModuleService.createModule.mockResolvedValue(mockCreatedModule);

            await ModuleController.createModule(mockRequest as Request, mockResponse as Response);

            expect(mockedModuleService.createModule).toHaveBeenCalledWith(moduleData);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockCreatedModule
            });
        });
    });

    describe('updateModule', () => {
        it('should update module successfully', async () => {
            const updateData = {
                title: 'Updated Module',
                description: 'Updated description',
                order: 2,
                isLocked: true
            };
            // Updated mock to match expected return type
            const mockUpdatedModule = {
                id: 1,
                courseId: 1,
                ...updateData,
                requiredXP: 0,
                xpReward: 10,
                estimatedTime: null,
                createdAt: new Date(),
                course: {
                    id: 1,
                    title: 'Course 1'
                }
            };
            
            mockRequest.params = { id: '1' };
            mockRequest.body = updateData;
            mockedModuleService.updateModule.mockResolvedValue(mockUpdatedModule);

            await ModuleController.updateModule(mockRequest as Request, mockResponse as Response);

            expect(mockedModuleService.updateModule).toHaveBeenCalledWith(1, updateData);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockUpdatedModule
            });
        });

        it('should throw BadRequestError for invalid ID', async () => {
            mockRequest.params = { id: 'invalid' };
            mockRequest.body = { title: 'Updated Module' };

            await expect(
                ModuleController.updateModule(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow(BadRequestError);
        });
    });

    describe('deleteModule', () => {
        it('should delete module successfully', async () => {
            // Updated mock to match expected return type
            const mockDeletedModule = {
                id: 1,
                title: 'Deleted Module',
                courseId: 1,
                description: 'Module description',
                order: 1,
                requiredXP: 0,
                xpReward: 10,
                estimatedTime: null,
                isLocked: false,
                createdAt: new Date()
            };
            
            mockRequest.params = { id: '1' };
            mockedModuleService.deleteModule.mockResolvedValue(mockDeletedModule);

            await ModuleController.deleteModule(mockRequest as Request, mockResponse as Response);

            expect(mockedModuleService.deleteModule).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Module with ID 1 successfully deleted',
                data: mockDeletedModule
            });
        });

        it('should throw BadRequestError for invalid ID', async () => {
            mockRequest.params = { id: 'invalid' };

            await expect(
                ModuleController.deleteModule(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow(BadRequestError);
        });
    });

    describe('getModulesByCourseId', () => {
        it('should return modules by valid course ID', async () => {
            // Updated mock to match expected return type
            const mockModules = [
                {
                    id: 1,
                    title: 'Module 1',
                    courseId: 1,
                    description: 'Description 1',
                    order: 1,
                    requiredXP: 0,
                    xpReward: 10,
                    estimatedTime: null,
                    isLocked: false,
                    createdAt: new Date(),
                    lessons: [
                        {
                            id: 1,
                            title: 'Lesson 1',
                            order: 1,
                            _count: {
                                exercises: 3
                            }
                        }
                    ]
                },
                {
                    id: 2,
                    title: 'Module 2',
                    courseId: 1,
                    description: 'Description 2',
                    order: 2,
                    requiredXP: 10,
                    xpReward: 15,
                    estimatedTime: null,
                    isLocked: false,
                    createdAt: new Date(),
                    lessons: [
                        {
                            id: 2,
                            title: 'Lesson 2',
                            order: 1,
                            _count: {
                                exercises: 2
                            }
                        }
                    ]
                }
            ];
            
            mockRequest.params = { courseId: '1' };
            mockedModuleService.findModulesByCourseId.mockResolvedValue(mockModules);

            await ModuleController.getModulesByCourseId(mockRequest as Request, mockResponse as Response);

            expect(mockedModuleService.findModulesByCourseId).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockModules
            });
        });

        it('should throw BadRequestError for invalid course ID', async () => {
            mockRequest.params = { courseId: 'invalid' };

            await expect(
                ModuleController.getModulesByCourseId(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow(BadRequestError);
        });
    });
});