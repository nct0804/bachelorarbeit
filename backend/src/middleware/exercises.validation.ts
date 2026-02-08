import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

/**
 * Valid exercise types based on your schema
 */
const validExerciseTypes = [
  'MULTIPLE_CHOICE',
  'VOCABULARY_CHECK',
  'FILL_IN_BLANK',
  'SENTENCE_ORDER',
  'PRONUNCIATION_PRACTICE'
];

/**
 * Middleware to validate exercise creation requests
 */
export const validateCreateExercise = (req: Request, res: Response, next: NextFunction) => {
  const { lessonId, type, question, order, options } = req.body;
  const errors = [];

  // Validate lessonId
  if (!lessonId) {
    errors.push('Lesson ID is required');
  } else if (typeof lessonId !== 'number') {
    errors.push('Lesson ID must be a number');
  }

  // Validate type
  if (!type) {
    errors.push('Exercise type is required');
  } else if (typeof type !== 'string') {
    errors.push('Exercise type must be a string');
  } else if (!validExerciseTypes.includes(type)) {
    errors.push(`Exercise type must be one of: ${validExerciseTypes.join(', ')}`);
  }

  // Validate question
  if (!question) {
    errors.push('Question is required');
  } else if (typeof question !== 'string') {
    errors.push('Question must be a string');
  } else if (question.length < 3) {
    errors.push('Question must be at least 3 characters long');
  }

  // Validate order
  if (order === undefined) {
    errors.push('Order is required');
  } else if (typeof order !== 'number') {
    errors.push('Order must be a number');
  }

  // Validate options based on exercise type
  if (['MULTIPLE_CHOICE', 'VOCABULARY_CHECK', 'FILL_IN_BLANK'].includes(type)) {
    if (!options || !Array.isArray(options) || options.length < 2) {
      errors.push(`${type} exercises require at least 2 options`);
    } else {
      // Check if at least one option is marked as correct
      const hasCorrectOption = options.some(option => option.isCorrect);
      if (!hasCorrectOption) {
        errors.push('At least one option must be marked as correct');
      }
      
      // Validate each option
      options.forEach((option, index) => {
        if (!option.text) {
          errors.push(`Option ${index + 1} must have text`);
        }
      });
    }
  }

  // If there are validation errors, throw a BadRequestError
  if (errors.length > 0) {
    throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
  }

  next();
};

/**
 * Middleware to validate exercise update requests
 */
export const validateUpdateExercise = (req: Request, res: Response, next: NextFunction) => {
  const { type, question, order, options } = req.body;
  const errors = [];
  
  // Check if at least one field is provided
  if (Object.keys(req.body).length === 0) {
    errors.push('At least one field must be provided for update');
  }

  // Validate type if provided
  if (type !== undefined) {
    if (typeof type !== 'string') {
      errors.push('Exercise type must be a string');
    } else if (!validExerciseTypes.includes(type)) {
      errors.push(`Exercise type must be one of: ${validExerciseTypes.join(', ')}`);
    }
  }

  // Validate question if provided
  if (question !== undefined) {
    if (typeof question !== 'string') {
      errors.push('Question must be a string');
    } else if (question.length < 3) {
      errors.push('Question must be at least 3 characters long');
    }
  }

  // Validate order if provided
  if (order !== undefined && typeof order !== 'number') {
    errors.push('Order must be a number');
  }

  // Validate options if provided
  if (options !== undefined) {
    if (!Array.isArray(options)) {
      errors.push('Options must be an array');
    } else if (options.length > 0) {
      // Check if at least one option is marked as correct
      const hasCorrectOption = options.some(option => option.isCorrect);
      if (!hasCorrectOption) {
        errors.push('At least one option must be marked as correct');
      }
      
      // Validate each option
      options.forEach((option, index) => {
        if (!option.text) {
          errors.push(`Option ${index + 1} must have text`);
        }
      });
    }
  }

  // If there are validation errors, throw a BadRequestError
  if (errors.length > 0) {
    throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
  }

  next();
};