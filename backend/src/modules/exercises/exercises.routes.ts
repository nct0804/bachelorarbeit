import express from 'express';
import * as ExerciseController from './exercises.controller';
import * as ExerciseService from './exercises.service';
import { authenticate, checkRole } from '../../middleware/auth.middleware';
import { handleError, BadRequestError } from '../../utils/errors';
import { validateCreateExercise, validateUpdateExercise } from '../../middleware/exercises.validation';

const router = express.Router();

// PUBLIC ROUTES - Accessible without authentication
// GET /api/exercises
router.get('/', async (req, res) => {
  try {
    await ExerciseController.getAllExercises(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

// GET /api/exercises/:id
router.get('/:id', async (req, res) => {
  try {
    await ExerciseController.getExerciseById(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

router.get(
  '/status/lesson/:lessonId',
  authenticate,
  async (req, res) => {
    try {
      const lessonId = Number(req.params.lessonId);
      const userId = (req as any).user?.id;

      if (isNaN(lessonId)) {
        throw new BadRequestError('Invalid lesson ID');
      }

      if (!userId) {
        throw new BadRequestError('User must be authenticated');
      }

      const exercisesWithStatus = await ExerciseService.getExercisesWithStatus(lessonId, userId);
      
      res.status(200).json({
        success: true,
        data: exercisesWithStatus
      });
    } catch (error) {
      handleError(error, res);
    }
  }
);

// /api/lessons/:lessonId/exercises
router.get('/lesson/:lessonId', async (req, res) => {
  try {
    await ExerciseController.getExercisesByLessonId(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

// POST /api/exercises/:id/check
router.post('/:id/check',authenticate, async (req, res) => {
  try {
    await ExerciseController.checkExerciseAnswer(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

// ADMIN ROUTES - Protected with authentication & role checking
// GET /api/exercises/:id/admin (admin)
router.get(
  '/:id/admin',
  authenticate,
  checkRole(['admin']),
  async (req, res) => {
    try {
      await ExerciseController.getExerciseWithAnswers(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// POST /api/exercises (admin)
router.post(
  '/',
  authenticate,
  checkRole(['admin']),
  validateCreateExercise,
  async (req, res) => {
    try {
      await ExerciseController.createExercise(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// PUT /api/exercises/:id (admin)
router.put(
  '/:id',
  authenticate,
  checkRole(['admin']),
  validateUpdateExercise,
  async (req, res) => {
    try {
      await ExerciseController.updateExercise(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// DELETE /api/exercises/:id (admin)
router.delete(
  '/:id',
  authenticate,
  checkRole(['admin']),
  async (req, res) => {
    try {
      await ExerciseController.deleteExercise(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);




export default router;