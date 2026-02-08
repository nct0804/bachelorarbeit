import express from 'express';
import * as ModuleController from './modules.controller';
import { authenticate, checkRole } from '../../middleware/auth.middleware';
import { handleError } from '../../utils/errors';
import { validateCreateModule, validateUpdateModule } from '../../middleware/modules.validation';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await ModuleController.getAllModules(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/course/:courseId/progress', authenticate, async (req, res) => {
  try {
    await ModuleController.getModulesWithProgress(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/:id', async (req, res) => {
  try {
    await ModuleController.getModuleById(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

router.get('/course/:courseId', async (req, res) => {
  try {
    await ModuleController.getModulesByCourseId(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

router.post('/', authenticate,checkRole(['admin']), validateCreateModule,
  async (req, res) => {
    try {
      await ModuleController.createModule(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

router.put('/:id', authenticate,checkRole(['admin']), validateUpdateModule,
  async (req, res) => {
    try {
      await ModuleController.updateModule(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

router.delete('/:id', authenticate, checkRole(['admin']), 
  async (req, res) => {
    try {
      await ModuleController.deleteModule(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

export default router;