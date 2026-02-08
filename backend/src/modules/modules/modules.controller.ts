import { Request, Response } from 'express';
import * as ModuleService from './modules.service';
import { BadRequestError, NotFoundError } from '../../utils/errors';

// GET /api/modules
export const getAllModules = async (req: Request, res: Response) => {
    const { courseId } = req.query;
    
    const modules = await ModuleService.findModules({
      courseId: courseId ? Number(courseId) : undefined
    });
    
    return res.status(200).json({
      success: true,
      data: modules
    });
};

// GET /api/modules/:id
export const getModuleById = async (req: Request, res: Response) => {
    const moduleId = Number(req.params.id);
    
    if (isNaN(moduleId)) {
      throw new BadRequestError('Invalid module ID');
    }
    
    const module = await ModuleService.findModuleById(moduleId);
    
    return res.status(200).json({
      success: true,
      data: module
    });
};

export const getModulesWithProgress = async (req: Request, res: Response) => {
    const courseId = Number(req.params.courseId);
    const userId = (req as any).user?.id;
    
    if (isNaN(courseId)) {
      throw new BadRequestError('Invalid course ID');
    }
    
    if (!userId) {
      throw new BadRequestError('User must be authenticated');
    }
    
    const modules = await ModuleService.getModulesWithProgress(courseId, userId);
    
    return res.status(200).json({
      success: true,
      data: modules
    });
};

//  POST /api/modules (admin)
export const createModule = async (req: Request, res: Response) => {
    const { courseId, title, description, order, isLocked } = req.body;
    
    const newModule = await ModuleService.createModule({
      courseId,
      title,
      description,
      order,
      isLocked
    });
    
    return res.status(201).json({
      success: true,
      data: newModule
    });
};

//  PUT /api/modules/:id (admin)
export const updateModule = async (req: Request, res: Response) => {
    const moduleId = Number(req.params.id);
    
    if (isNaN(moduleId)) {
      throw new BadRequestError('Invalid module ID');
    }
    
    const { title, description, order, isLocked } = req.body;
    
    const updatedModule = await ModuleService.updateModule(moduleId, {
      title,
      description,
      order,
      isLocked
    });
    
    return res.status(200).json({
      success: true,
      data: updatedModule
    });
};

// DELETE /api/modules/:id (admin)
export const deleteModule = async (req: Request, res: Response) => {
    const moduleId = Number(req.params.id);
    
    if (isNaN(moduleId)) {
      throw new BadRequestError('Invalid module ID');
    }
    
    const deletedModule = await ModuleService.deleteModule(moduleId);
    
    return res.status(200).json({
      success: true,
      message: `Module with ID ${moduleId} successfully deleted`,
      data: deletedModule
    });
 
};

// GET /api/courses/:courseId/modules
export const getModulesByCourseId = async (req: Request, res: Response) => {
    const courseId = Number(req.params.courseId);
    
    if (isNaN(courseId)) {
      throw new BadRequestError('Invalid course ID');
    }
    
    const modules = await ModuleService.findModulesByCourseId(courseId);
    
    return res.status(200).json({
      success: true,
      data: modules
    });
};