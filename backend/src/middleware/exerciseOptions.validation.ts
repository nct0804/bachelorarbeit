import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

/**
 * Middleware to validate option creation requests
 */
export const validateCreateOption = (req: Request, res: Response, next: NextFunction) => {
  const { exerciseId, text, isCorrect } = req.body;
  const errors = [];

  // Validate exerciseId
  if (!exerciseId) {
    errors.push('Exercise ID is required');
  } else if (typeof exerciseId !== 'number') {
    errors.push('Exercise ID must be a number');
  }

  // Validate text
  if (!text) {
    errors.push('Text is required');
  } else if (typeof text !== 'string') {
    errors.push('Text must be a string');
  }

  // Validate isCorrect if provided
  if (isCorrect !== undefined && typeof isCorrect !== 'boolean') {
    errors.push('isCorrect must be a boolean');
  }

  // If there are validation errors, throw a BadRequestError
  if (errors.length > 0) {
    throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
  }

  next();
};

/**
 * Middleware to validate option update requests
 */
export const validateUpdateOption = (req: Request, res: Response, next: NextFunction) => {
  const { text, isCorrect, order } = req.body;
  const errors = [];
  
  // Check if at least one field is provided
  if (Object.keys(req.body).length === 0) {
    errors.push('At least one field must be provided for update');
  }

  // Validate text if provided
  if (text !== undefined) {
    if (typeof text !== 'string') {
      errors.push('Text must be a string');
    } else if (text.length === 0) {
      errors.push('Text cannot be empty');
    }
  }

  // Validate isCorrect if provided
  if (isCorrect !== undefined && typeof isCorrect !== 'boolean') {
    errors.push('isCorrect must be a boolean');
  }

  // Validate order if provided
  if (order !== undefined && typeof order !== 'number') {
    errors.push('Order must be a number');
  }

  // If there are validation errors, throw a BadRequestError
  if (errors.length > 0) {
    throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
  }

  next();
};
