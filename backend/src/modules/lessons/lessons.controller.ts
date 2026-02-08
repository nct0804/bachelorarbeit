import { Request, Response } from 'express';
import * as LessonService from './lessons.service';
import { NotFoundError, BadRequestError } from '../../utils/errors';

// Get all lessons, with optional filtering by moduleId
export const getAllLessons = async (req: Request, res: Response) => {
    const { moduleId } = req.query;
    
    const lessons = await LessonService.findLessons({
      moduleId: moduleId ? Number(moduleId) : undefined
    });
    
    return res.status(200).json({
      success: true,
      data: lessons
    });
};

// Get a specific lesson by ID with its exercises
export const getLessonById = async (req: Request, res: Response) => {
    const lessonId = Number(req.params.id);
    
    if (isNaN(lessonId)) {
      throw new BadRequestError('Invalid lesson ID');
    }
    
    const lesson = await LessonService.findLessonById(lessonId);
    
    if (!lesson) {
      throw new NotFoundError(`Lesson with ID ${lessonId} not found`);
    }
    
    return res.status(200).json({
      success: true,
      data: lesson
    });
};

//Create a new lesson
export const createLesson = async (req: Request, res: Response) => {
    const { moduleId, title, description, order, xpReward, estimatedTime } = req.body;
    
    const newLesson = await LessonService.createLesson({
      moduleId,
      title,
      description,
      order,
      xpReward,
      estimatedTime
    });
    
    return res.status(201).json({
      success: true,
      data: newLesson
    });
};

//Update an lesson
export const updateLesson = async (req: Request, res: Response) => {
    const lessonId = Number(req.params.id);
    
    if (isNaN(lessonId)) {
      throw new BadRequestError('Invalid lesson ID');
    }
    
    const { title, description, order, xpReward, estimatedTime } = req.body;
    
    const updatedLesson = await LessonService.updateLesson(lessonId, {
      title,
      description,
      order,
      xpReward,
      estimatedTime
    });
    
    if (!updatedLesson) {
      throw new NotFoundError(`Lesson with ID ${lessonId} not found`);
    }
    
    return res.status(200).json({
      success: true,
      data: updatedLesson
    });
};

//Delete a lesson
export const deleteLesson = async (req: Request, res: Response) => {
    const lessonId = Number(req.params.id);
    
    if (isNaN(lessonId)) {
      throw new BadRequestError('Invalid lesson ID');
    }
    
    const deletedLesson = await LessonService.deleteLesson(lessonId);
    
    if (!deletedLesson) {
      throw new NotFoundError(`Lesson with ID ${lessonId} not found`);
    }
    
    return res.status(200).json({
      success: true,
      message: `Lesson with ID ${lessonId} successfully deleted`,
      data: deletedLesson
    });
};

//all lessons for a specific module
export const getLessonsByModuleId = async (req: Request, res: Response) => {
    const moduleId = Number(req.params.moduleId);
    
    if (isNaN(moduleId)) {
      throw new BadRequestError('Invalid module ID');
    }
    
    const lessons = await LessonService.findLessons({ moduleId });
    
    return res.status(200).json({
      success: true,
      data: lessons
    });
};

export const getLessonsWithProgress = async (req: Request, res: Response) => {
    const moduleId = Number(req.params.moduleId);
    
    if (isNaN(moduleId)) {
      throw new BadRequestError('Invalid module ID');
    }
    
    // Get user ID from the authenticated request
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw new BadRequestError('User must be authenticated');
    }
    
    const lessons = await LessonService.getLessonsWithProgress(moduleId, userId);
    
    return res.status(200).json({
      success: true,
      data: lessons
    });
};

