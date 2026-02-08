import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

const prisma = new PrismaClient();

interface FindLessonsParams {
  moduleId?: number;
}

interface CreateLessonParams {
  moduleId: number;
  title: string;
  description?: string;
  order: number;
  xpReward?: number;
  estimatedTime?: number;
}

interface UpdateLessonParams {
  title?: string;
  description?: string | null;
  order?: number;
  xpReward?: number;
  estimatedTime?: number | null;
}


//Find lessons with optional filtering

export const findLessons = async ({ moduleId }: FindLessonsParams = {}) => {
  const where = moduleId ? { moduleId } : {};
  
  return prisma.lesson.findMany({
    where,
    orderBy: { order: 'asc' },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          courseId: true
        }
      }
    }
  });
};

//Find a lesson by ID with its exercises
export const findLessonById = async (id: number) => {
  return prisma.lesson.findUnique({
    where: { id },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          courseId: true
        }
      },
      exercises: {
        orderBy: { order: 'asc' },
        include: {
          exerciseOptions: {
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  });
};

//Create a new lesson
export const createLesson = async (data: CreateLessonParams) => {
  // Verify the module exists
  const module = await prisma.module.findUnique({
    where: { id: data.moduleId }
  });

  if (!module) {
    throw new NotFoundError(`Module with ID ${data.moduleId} not found`);
  }

  return prisma.lesson.create({
    data: {
      moduleId: data.moduleId,
      title: data.title,
      description: data.description,
      order: data.order,
      xpReward: data.xpReward || 5, // Default xp reward (Change as needed)
      estimatedTime: data.estimatedTime
    },
    include: {
      module: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });
};

//Update an existing lesson
export const updateLesson = async (id: number, data: UpdateLessonParams) => {
  // Check if the lesson exists
  const existingLesson = await prisma.lesson.findUnique({
    where: { id }
  });

  if (!existingLesson) {
    return null;
  }

  return prisma.lesson.update({
    where: { id },
    data,
    include: {
      module: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });
};

//Delete a lesson
export const deleteLesson = async (id: number) => {
  // Check if the lesson exists
  const existingLesson = await prisma.lesson.findUnique({
    where: { id }
  });

  if (!existingLesson) {
    return null;
  }

  return prisma.lesson.delete({
    where: { id }
  });
};

/**
 * Get lessons with user progress information
 */
export const getLessonsWithProgress = async (moduleId: number, userId: string) => {
  // Get all lessons for the module
  const lessons = await prisma.lesson.findMany({
    where: { moduleId },
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: {
          exercises: true
        }
      }
    }
  });

  if (lessons.length === 0) {
    return [];
  }

  // Get user's completed exercise progress for this module's lessons
  const completedProgress = await prisma.exerciseProgress.findMany({
    where: {
      userId,
      completed: true,
      Exercise: {
        lesson: {
          moduleId
        }
      }
    },
    include: {
      Exercise: {
        select: {
          lessonId: true
        }
      }
    }
  });

  // Create a map of lessonId -> count of completed exercises
  const completedExercisesByLesson = new Map<number, Set<number>>();
  
  completedProgress.forEach(progress => {
    if (!progress.Exercise) return;
    
    const lessonId = progress.Exercise.lessonId;
    if (!completedExercisesByLesson.has(lessonId)) {
      completedExercisesByLesson.set(lessonId, new Set());
    }
    
    completedExercisesByLesson.get(lessonId)!.add(progress.exerciseId!);
  });

  // Calculate lesson unlock status - first lesson is always unlocked
  let previousLessonCompleted = true; // First lesson is always accessible

  // Process each lesson with progress information
  const lessonsWithProgress = await Promise.all(
    lessons.map(async (lesson, index) => {
      // Get count of completed exercises for this lesson
      const completedExercises = completedExercisesByLesson.get(lesson.id)?.size || 0;
      const totalExercises = lesson._count.exercises;
      
      // Calculate progress percentage
      const progress = totalExercises > 0 ? completedExercises / totalExercises : 0;
      
      // Determine if lesson is completed
      const isCompleted = progress === 1 && totalExercises > 0;
      
      // Determine lesson status (locked/learn/practice)
      // First lesson is always unlocked, others require previous lesson to be completed
      const isLocked = index > 0 && !previousLessonCompleted;
      
      // Update for next iteration
      if (isCompleted) {
        previousLessonCompleted = true;
      }

      // Determine lesson status and action label
      const status = isLocked ? "locked" : (isCompleted ? "practice" : "learn");
      const actionLabel = isLocked ? "LOCKED" : (isCompleted ? "PRACTICE" : "LEARN");

      return {
        ...lesson,
        progress,
        completedExercises,
        totalExercises,
        isCompleted,
        isLocked,
        status, 
        actionLabel,
        isLearned: isCompleted // This is the flag frontend needs
      };
    })
  );

  return lessonsWithProgress;
};