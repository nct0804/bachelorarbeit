import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

export const validateCreateModule = (req: Request, res: Response, next: NextFunction) => {
  const { courseId, title, order } = req.body;
  const errors = [];

  // Validate courseId
  if (!courseId) {
    errors.push('Course ID is required');
  } else if (typeof courseId !== 'number') {
    errors.push('Course ID must be a number');
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

export const validateUpdateModule = (req: Request, res: Response, next: NextFunction) => {
  const { title, description, order, isLocked } = req.body;
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

  // Validate description if provided
  if (description !== undefined && description !== null && typeof description !== 'string') {
    errors.push('Description must be a string');
  }

  // Validate order if provided
  if (order !== undefined && typeof order !== 'number') {
    errors.push('Order must be a number');
  }

  // Validate isLocked if provided
  if (isLocked !== undefined && typeof isLocked !== 'boolean') {
    errors.push('isLocked must be a boolean');
  }

  // If there are validation errors, throw a BadRequestError
  if (errors.length > 0) {
    throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
  }

  next();
};