import express from 'express';
import * as CourseController from './courses.controller';
import { authenticate, checkRole } from '../../middleware/auth.middleware';
import { handleError } from '../../utils/errors';
import { validateCreateCourse, validateUpdateCourse } from '../../middleware/courses.validation';

const router = express.Router();

// PubLic , without ADMIN
router.get('/', async (req, res) => {
  try {
    await CourseController.getAllCourses(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/:id', async (req, res) => {
  try {
    await CourseController.getCourseById(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

// with ADMIN
router.post('/', authenticate, checkRole(['admin']), validateCreateCourse,
  async (req, res) => {
    try {
      await CourseController.createCourse(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

router.put('/:id', authenticate, checkRole(['admin']), validateUpdateCourse,
  async (req, res) => {
    try {
      await CourseController.updateCourse(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

router.delete('/:id', authenticate, checkRole(['admin']), 
  async (req, res) => {
    try {
      await CourseController.deleteCourse(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

router.get('/:id/progress', authenticate, async (req, res) => {
  try {
    await CourseController.getCourseWithProgress(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/progress/all', authenticate, async (req, res) => {
  try {
    await CourseController.getAllCoursesWithProgress(req, res);
  } catch (error) {
    handleError(error, res);
  }
});


export default router;