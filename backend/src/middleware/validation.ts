import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';


export const validate = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors
      .array()
      .map((e) => ({
        field: 'param' in e ? e.param : undefined,
        message: e.msg
      }));
    throw new BadRequestError(
      "Validation failed: " + JSON.stringify(formatted)
    );
  }
  next();
};

export const registerValidation = [
  body("email").isEmail().withMessage("Invalid e-mail").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password min 8 chars")
    .matches(/\d/)
    .withMessage("Needs a number"),
  validate,
];

export const loginValidation = [
  body("email").isEmail(),
  body("password").notEmpty(),
  validate,
];

export const updateProfileValidation = [
  body("email").optional().isEmail(),
  body("firstName").optional().isLength({ min: 2, max: 50 }),
  body("lastName").optional().isLength({ min: 2, max: 50 }),
  validate,
];

export const changePasswordValidation = [
  body("currentPassword").notEmpty(),
  body("newPassword")
    .isLength({ min: 8 })
    .matches(/\d/)
    .withMessage("Needs a number"),
  validate,
];

export const requestPasswordResetValidation = [
  body("email").isEmail(),
  validate,
];

export const resetPasswordValidation = [
  body("token").notEmpty(),
  body("newPassword").isLength({ min: 8 }),
  validate,
];
