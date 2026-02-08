import { Request, Response } from 'express';
import * as ExerciseService from './exercises.service';
import { BadRequestError } from '../../utils/errors';

// GET /api/exercises
export const getAllExercises = async (req: Request, res: Response) => {
    const { lessonId, type } = req.query;
    
    const exercises = await ExerciseService.findExercises({
      lessonId: lessonId ? Number(lessonId) : undefined,
      type: type ? String(type) : undefined
    });
    
    return res.status(200).json({
      success: true,
      data: exercises
    });
};

//  GET /api/exercises/:id
export const getExerciseById = async (req: Request, res: Response) => {
    const exerciseId = Number(req.params.id);
    
    if (isNaN(exerciseId)) {
      throw new BadRequestError('Invalid exercise ID');
    }
    
    const exercise = await ExerciseService.findExerciseById(exerciseId);
    
    return res.status(200).json({
      success: true,
      data: exercise
    });
};

// GET /api/exercises/:id/admin
export const getExerciseWithAnswers = async (req: Request, res: Response) => {

    const exerciseId = Number(req.params.id);
    
    if (isNaN(exerciseId)) {
      throw new BadRequestError('Invalid exercise ID');
    }
    
    const exercise = await ExerciseService.findExerciseByIdWithAnswers(exerciseId);
    
    return res.status(200).json({
      success: true,
      data: exercise
    });
};

// POST /api/exercises
export const createExercise = async (req: Request, res: Response) => {
    const { lessonId, type, question, instruction, order, xpReward, timeLimit, options } = req.body;
    
    const newExercise = await ExerciseService.createExercise({
      lessonId,
      type,
      question,
      instruction,
      order,
      xpReward,
      timeLimit,
      options
    });
    
    return res.status(201).json({
      success: true,
      data: newExercise
    });
};

//  PUT /api/exercises/:id
export const updateExercise = async (req: Request, res: Response) => {
    const exerciseId = Number(req.params.id);
    if (isNaN(exerciseId)) {
      throw new BadRequestError('Invalid exercise ID');
    }
    
    const { type, question, instruction, order, xpReward, timeLimit, options } = req.body;
    
    const updatedExercise = await ExerciseService.updateExercise(exerciseId, {
      type,
      question,
      instruction,
      order,
      xpReward,
      timeLimit,
      options
    });
    
    return res.status(200).json({
      success: true,
      data: updatedExercise
    });
};

// DELETE /api/exercises/:id
export const deleteExercise = async (req: Request, res: Response) => {
    const exerciseId = Number(req.params.id);
    
    if (isNaN(exerciseId)) {
      throw new BadRequestError('Invalid exercise ID');
    }
    
    await ExerciseService.deleteExercise(exerciseId);
    
    return res.status(200).json({
      success: true,
      message: `Exercise with ID ${exerciseId} successfully deleted`
    });
};

// POST /api/exercises/:id/check
export const checkExerciseAnswer = async (req: Request, res: Response) => {
    const exerciseId = Number(req.params.id);
    
    if (isNaN(exerciseId)) {
      throw new BadRequestError('Invalid exercise ID');
    }
    
    const { answer } = req.body;
    
    if (answer === undefined) {
      throw new BadRequestError('An answer must be provided');
    }
    
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw new BadRequestError('User must be authenticated to check answers');
    }
    
    const result = await ExerciseService.checkAnswer(exerciseId, answer, userId);
    
    return res.status(200).json({
      success: true,
      data: result
    });
};

//  GET /api/lessons/:lessonId/exercises
export const getExercisesByLessonId = async (req: Request, res: Response) => {
    const lessonId = Number(req.params.lessonId);
    
    if (isNaN(lessonId)) {
      throw new BadRequestError('Invalid lesson ID');
    }
    
    const exercises = await ExerciseService.findExercises({ lessonId });
    
    return res.status(200).json({
      success: true,
      data: exercises
    });
};