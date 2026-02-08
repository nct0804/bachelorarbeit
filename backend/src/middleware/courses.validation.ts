import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';
// import { LanguageLevel } from '@prisma/client';

// Should match the LanguageLevel enum values
const validLevels = ['A1_1', 'A1_2', 'A2_1', 'A2_2'];

/**
 * Middleware to validate course creation requests
 */
export const validateCreateCourse = (req: Request, res: Response, next: NextFunction) => {
  const { title, description, level, order, imageSrc } = req.body;
  const errors = [];

  // Validate title
  if (!title) {
    errors.push('Title is required');
  } else if (typeof title !== 'string') {
    errors.push('Title must be a string');
  } else if (title.length < 3) {
    errors.push('Title must be at least 3 characters long');
  }

  // Validate description
  if (!description) {
    errors.push('Description is required');
  } else if (typeof description !== 'string') {
    errors.push('Description must be a string');
  } else if (description.length < 10) {
    errors.push('Description must be at least 10 characters long');
  }

  // Validate level
  if (!level) {
    errors.push('Level is required');
  } else if (typeof level !== 'string') {
    errors.push('Level must be a string');
  } else if (!validLevels.includes(level)) {
    errors.push(`Level must be one of: ${validLevels.join(', ')}`);
  }

  // Validate order
  if (order === undefined) {
    errors.push('Order is required');
  } else if (typeof order !== 'number') {
    errors.push('Order must be a number');
  }

  // Validate imageSrc if provided
  if (imageSrc !== undefined && imageSrc !== '' && typeof imageSrc !== 'string') {
    errors.push('Image source must be a string');
  }

  // If there are validation errors, throw a BadRequestError
  if (errors.length > 0) {
    throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
  }

  next();
};

/**
 * Middleware to validate course update requests
 */
export const validateUpdateCourse = (req: Request, res: Response, next: NextFunction) => {
  const { title, description, level, order, imageSrc } = req.body;
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
  if (description !== undefined) {
    if (typeof description !== 'string') {
      errors.push('Description must be a string');
    } else if (description.length < 10) {
      errors.push('Description must be at least 10 characters long');
    }
  }

  // Validate level if provided
  if (level !== undefined) {
    if (typeof level !== 'string') {
      errors.push('Level must be a string');
    } else if (!validLevels.includes(level)) {
      errors.push(`Level must be one of: ${validLevels.join(', ')}`);
    }
  }

  // Validate order if provided
  if (order !== undefined && typeof order !== 'number') {
    errors.push('Order must be a number');
  }

  // Validate imageSrc if provided
  if (imageSrc !== undefined && imageSrc !== null && typeof imageSrc !== 'string') {
    errors.push('Image source must be a string');
  }

  // If there are validation errors, throw a BadRequestError
  if (errors.length > 0) {
    throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
  }

  next();
};