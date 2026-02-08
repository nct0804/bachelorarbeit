import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

const prisma = new PrismaClient();

interface FindModulesParams {
  courseId?: number;
}

interface CreateModuleParams {
  courseId: number;
  title: string;
  description?: string;
  order: number;
  isLocked?: boolean;
}

interface UpdateModuleParams {
  title?: string;
  description?: string | null;
  order?: number;
  isLocked?: boolean;
}

export const findModules = async ({ courseId }: FindModulesParams = {}) => {
  const where = courseId ? { courseId } : {};
  
  return prisma.module.findMany({
    where,
    orderBy: { order: 'asc' },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          level: true
        }
      },
      _count: {
        select: {
          lessons: true
        }
      }
    }
  });
};

export const findModuleById = async (id: number) => {
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          level: true
        }
      },
      lessons: {
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: {
              exercises: true
            }
          }
        }
      }
    }
  });

  if (!module) {
    throw new NotFoundError(`Module with ID ${id} not found`);
  }

  return module;
};

export const createModule = async (data: CreateModuleParams) => {
  // Verify the course exists
  const course = await prisma.course.findUnique({
    where: { id: data.courseId }
  });

  if (!course) {
    throw new NotFoundError(`Course with ID ${data.courseId} not found`);
  }

  return prisma.module.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      order: data.order,
      isLocked: data.isLocked ?? false // Default is unlocked
    },
    include: {
      course: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });
};

export const updateModule = async (id: number, data: UpdateModuleParams) => {
  // Check if the module exists
  const existingModule = await prisma.module.findUnique({
    where: { id }
  });

  if (!existingModule) {
    throw new NotFoundError(`Module with ID ${id} not found`);
  }

  return prisma.module.update({
    where: { id },
    data,
    include: {
      course: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });
};

export const deleteModule = async (id: number) => {
  // Check if the module exists
  const existingModule = await prisma.module.findUnique({
    where: { id }
  });

  if (!existingModule) {
    throw new NotFoundError(`Module with ID ${id} not found`);
  }

  return prisma.module.delete({
    where: { id }
  });
};

export const findModulesByCourseId = async (courseId: number) => {
  // Check if the course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    throw new NotFoundError(`Course with ID ${courseId} not found`);
  }

  return prisma.module.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        select: {
          id: true,
          title: true,
          order: true,
          _count: {
            select: {
              exercises: true
            }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  });
};

export const getModulesWithProgress = async (courseId: number, userId: string) => {
  // Get all modules for the course
  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        include: {
          _count: {
            select: {
              exercises: true
            }
          }
        }
      },
      prerequisites: {
        include: {
          prerequisiteModule: true
        }
      }
    }
  });

  if (modules.length === 0) {
    return [];
  }

  // Get user's completed exercise progress for this course's modules
  const completedProgress = await prisma.exerciseProgress.findMany({
    where: {
      userId,
      completed: true,
      Exercise: {
        lesson: {
          module: {
            courseId
          }
        }
      }
    },
    include: {
      Exercise: {
        select: {
          lessonId: true,
          lesson: {
            select: {
              moduleId: true
            }
          }
        }
      }
    }
  });

   // Create a map of moduleId -> completed exercises count
  const completedExercisesByModule = new Map<number, Set<number>>();
  const moduleExerciseTotal = new Map<number, number>();
  
  // Initialize the maps for each module
  for (const module of modules) {
    completedExercisesByModule.set(module.id, new Set());
    
    // Count total exercises in this module
    let totalExercises = 0;
    for (const lesson of module.lessons) {
      totalExercises += lesson._count.exercises;
    }
    moduleExerciseTotal.set(module.id, totalExercises);
  }
  
  // Fill in completed exercises
  completedProgress.forEach(progress => {
    if (!progress.Exercise?.lesson?.moduleId) return;
    
    const moduleId = progress.Exercise.lesson.moduleId;
    if (completedExercisesByModule.has(moduleId)) {
      completedExercisesByModule.get(moduleId)!.add(progress.exerciseId!);
    }
  });

   // Calculate module unlock status - first module is always unlocked
  let previousModuleCompleted = true; // First module always accessible
  
  // Check if any module has explicit prerequisites
  const modulePrerequisites = new Map<number, number[]>();
  for (const module of modules) {
    if (module.prerequisites.length > 0) {
      modulePrerequisites.set(
        module.id, 
        module.prerequisites.map(prereq => prereq.prerequisiteId)
      );
    }
  }
 // Process each module with progress information
  const modulesWithProgress = modules.map((module, index) => {
    // Get count of completed exercises for this module
    const completedExercises = completedExercisesByModule.get(module.id)?.size || 0;
    const totalExercises = moduleExerciseTotal.get(module.id) || 0;
    
    // Calculate progress percentage
    const progress = totalExercises > 0 ? completedExercises / totalExercises : 0;
    
    // Determine if module is completed
    const isCompleted = progress === 1 && totalExercises > 0;
    
    // Check if this module is locked:
    // 1. First check explicit prerequisites if they exist
    // 2. Otherwise use default sequential unlocking (previous module must be completed)
    let isLocked = false;
    
    if (modulePrerequisites.has(module.id)) {
      // Check if all prerequisites are completed
      const prereqIds = modulePrerequisites.get(module.id)!;
      const prereqModules = modules.filter(m => prereqIds.includes(m.id));
      isLocked = !prereqModules.every(m => {
        const prereqCompletedExercises = completedExercisesByModule.get(m.id)?.size || 0;
        const prereqTotalExercises = moduleExerciseTotal.get(m.id) || 0;
        return prereqTotalExercises > 0 && prereqCompletedExercises === prereqTotalExercises;
      });
    } else {
      // Use sequential unlocking
      isLocked = index > 0 && !previousModuleCompleted;
    }
    
    // Update for next iteration
    if (isCompleted) {
      previousModuleCompleted = true;
    }
  // Determine module status and action label
    const status = isLocked ? "locked" : (isCompleted ? "practice" : "learn");
    const actionLabel = isLocked ? "LOCKED" : (isCompleted ? "PRACTICE" : "CONTINUE");
    
    // Count lessons in this module
    const totalLessons = module.lessons.length;
    const completedLessons = module.lessons.filter(lesson => {
      const lessonExercises = lesson._count.exercises;
      const completedLessonExercises = module.lessons
        .filter(l => l.id === lesson.id)
        .flatMap(l => Array.from(completedExercisesByModule.get(module.id) || [])
          .filter(exerciseId => {
            // Find if this exerciseId belongs to this lesson
            const progress = completedProgress.find(p => p.exerciseId === exerciseId);
            return progress?.Exercise?.lessonId === lesson.id;
          })
        ).length;
      
      return lessonExercises > 0 && completedLessonExercises === lessonExercises;
    }).length;

    return {
      ...module,
      progress,
      completedExercises,
      totalExercises,
      completedLessons,
      totalLessons,
      isCompleted,
      isLocked,
      status,
      actionLabel
    };
  });

  return modulesWithProgress;
};
