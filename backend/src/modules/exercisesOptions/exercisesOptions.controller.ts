import { Request, Response } from 'express';
import * as ExerciseOptionsService from './exercisesOptions.service';
import { BadRequestError } from '../../utils/errors';

// GET /api/exercises/:exerciseId/options
export const getOptionsByExerciseId = async (req: Request, res: Response) => {
    const exerciseId = Number(req.params.exerciseId);
    
    if (isNaN(exerciseId)) {
      throw new BadRequestError('Invalid exercise ID');
    }
    
    const options = await ExerciseOptionsService.findOptionsByExerciseId(exerciseId);
    
    return res.status(200).json({
      success: true,
      data: options
    });
};

//  GET /api/exercises/:exerciseId/options/admin (admin)
export const getOptionsWithAnswers = async (req: Request, res: Response) => {
    const exerciseId = Number(req.params.exerciseId);
    
    if (isNaN(exerciseId)) {
      throw new BadRequestError('Invalid exercise ID');
    }
    
    const options = await ExerciseOptionsService.findOptionsByExerciseIdWithAnswers(exerciseId);
    
    return res.status(200).json({
      success: true,
      data: options
    });
};

// GET /api/exercise-options/:id
export const getOptionById = async (req: Request, res: Response) => {
    const optionId = Number(req.params.id);
    
    if (isNaN(optionId)) {
      throw new BadRequestError('Invalid option ID');
    }
    
    const option = await ExerciseOptionsService.findOptionById(optionId);
    
    return res.status(200).json({
      success: true,
      data: option
    });
};

// POST /api/exercise-options
export const createOption = async (req: Request, res: Response) => {
    const { exerciseId, text, isCorrect, order, imageSrc, audioSrc } = req.body;
    
    if (!exerciseId || !text) {
      throw new BadRequestError('Exercise ID and text are required');
    }
    
    const newOption = await ExerciseOptionsService.createExerciseOption({
      exerciseId,
      text,
      isCorrect: isCorrect ?? false,
      order,
      imageSrc,
      audioSrc
    });
    
    return res.status(201).json({
      success: true,
      data: newOption
    });
};

// PUT /api/exercise-options/:id
export const updateOption = async (req: Request, res: Response) => {
    const optionId = Number(req.params.id);
    
    if (isNaN(optionId)) {
      throw new BadRequestError('Invalid option ID');
    }
    
    const { text, isCorrect, order, imageSrc, audioSrc } = req.body;
    
    const updatedOption = await ExerciseOptionsService.updateExerciseOption(optionId, {
      text,
      isCorrect,
      order,
      imageSrc,
      audioSrc
    });
    
    return res.status(200).json({
      success: true,
      data: updatedOption
    });
};

// DELETE /api/exercise-options/:id
export const deleteOption = async (req: Request, res: Response) => {
    const optionId = Number(req.params.id);
    
    if (isNaN(optionId)) {
      throw new BadRequestError('Invalid option ID');
    }
    
    await ExerciseOptionsService.deleteExerciseOption(optionId);
    
    return res.status(200).json({
      success: true,
      message: `Option with ID ${optionId} successfully deleted`
    });
};