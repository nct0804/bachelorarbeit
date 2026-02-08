import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

export const validateCreateLesson = (req: Request, res: Response, next: NextFunction) => {
  const { moduleId, title, order } = req.body;
  const errors = [];

  // Validate moduleId
  if (!moduleId) {
    errors.push('Module ID is required');
  } else if (typeof moduleId !== 'number') {
    errors.push('Module ID must be a number');
  }

  // Validate title
  if (!title) {
    errors.push('Title is required');
  } else if (typeof title !== 'string') {
    errors.push('Title must be a string');
  } else if (title.length < 3) {
    errors.push('Title must be at least 3 characters long');
  }

  // Validate order
  if (order === undefined) {
    errors.push('Order is required');
  } else if (typeof order !== 'number') {
    errors.push('Order must be a number');
  }

  // If there are validation errors, throw a BadRequestError
  if (errors.length > 0) {
    throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
  }

  next();
};

export const validateUpdateLesson = (req: Request, res: Response, next: NextFunction) => {
  const { title, order, xpReward, estimatedTime } = req.body;
  const errors = [];
  
  // Check if at least one field is provided
  if (Object.keys(req.body).length === 0) {
    errors.push('At least one field must be provided for update');
  }

  // Validate title if provided
  if (title !== undefined) {
    if (typeof title !== 'string') {
      errors.push('Title must be a string');
    } else if (title.length < 3) {
      errors.push('Title must be at least 3 characters long');
    }
  }

  // Validate order if provided
  if (order !== undefined && typeof order !== 'number') {
    errors.push('Order must be a number');
  }

  // Validate xpReward if provided
  if (xpReward !== undefined && typeof xpReward !== 'number') {
    errors.push('XP reward must be a number');
  }

  // Validate estimatedTime if provided
  if (estimatedTime !== undefined && estimatedTime !== null && typeof estimatedTime !== 'number') {
    errors.push('Estimated time must be a number');
  }

  // If there are validation errors, throw a BadRequestError
  if (errors.length > 0) {
    throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
  }

  next();
};