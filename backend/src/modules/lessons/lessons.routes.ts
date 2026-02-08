import express from 'express';
import * as LessonController from './lessons.controller';
import { authenticate, checkRole } from '../../middleware/auth.middleware';
import { validateCreateLesson, validateUpdateLesson } from '../../middleware/lessons.validation';
import { handleError } from '../../utils/errors';


const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await LessonController.getAllLessons(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/:id', async (req, res) => {
  try {
    await LessonController.getLessonById(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/module/:moduleId', async (req, res) => {
  try {
    await LessonController.getLessonsByModuleId(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

router.post('/', authenticate, checkRole(['admin']), validateCreateLesson, 
  async (req, res) => {
    try {
      await LessonController.createLesson(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

router.put(
  '/:id', authenticate, checkRole(['admin']), validateUpdateLesson, 
  async (req, res) => {
    try {
      await LessonController.updateLesson(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

router.delete('/:id', authenticate, checkRole(['admin']), 
  async (req, res) => {
    try {
      await LessonController.deleteLesson(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

router.get('/module/:moduleId/progress', authenticate, async (req, res) => {
  try {
    await LessonController.getLessonsWithProgress(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

export default router;