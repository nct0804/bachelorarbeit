import express from 'express';
import * as OptionsController from './exercisesOptions.controller';
import { authenticate, checkRole } from '../../middleware/auth.middleware';
import { handleError } from '../../utils/errors';
import { validateCreateOption, validateUpdateOption } from '../../middleware/exerciseOptions.validation';

const router = express.Router();

// PUBLIC ROUTES - Accessible without authentication

// GET /api/exercises/:exerciseId/options
router.get('/exercise/:exerciseId', async (req, res) => {
  try {
    await OptionsController.getOptionsByExerciseId(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

// ADMIN ROUTES - Protected with authentication & role checking

// GET /api/exercises/:exerciseId/options/admin
router.get(
  '/exercise/:exerciseId/admin',
  authenticate,
  checkRole(['admin']),
  async (req, res) => {
    try {
      await OptionsController.getOptionsWithAnswers(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

//  (admin)GET /api/exercise-options/:id
router.get(
  '/:id',
  authenticate,
  checkRole(['admin']),
  async (req, res) => {
    try {
      await OptionsController.getOptionById(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// POST /api/exercise-options (admin)
router.post(
  '/',
  authenticate,
  checkRole(['admin']),
  validateCreateOption,
  async (req, res) => {
    try {
      await OptionsController.createOption(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// PUT /api/exercise-options/:id (admin)
router.put(
  '/:id',
  authenticate,
  checkRole(['admin']),
  validateUpdateOption,
  async (req, res) => {
    try {
      await OptionsController.updateOption(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// DELETE /api/exercise-options/:id (admin)
router.delete(
  '/:id',
  authenticate,
  checkRole(['admin']),
  async (req, res) => {
    try {
      await OptionsController.deleteOption(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

export default router;