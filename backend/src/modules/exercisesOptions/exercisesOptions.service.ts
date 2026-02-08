import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

const prisma = new PrismaClient();

interface CreateOptionParams {
  exerciseId: number;
  text: string;
  isCorrect: boolean;
  order?: number;
  imageSrc?: string;
  audioSrc?: string;
}

interface UpdateOptionParams {
  text?: string;
  isCorrect?: boolean;
  order?: number;
  imageSrc?: string | null;
  audioSrc?: string | null;
}

export const findOptionsByExerciseId = async (exerciseId: number) => {
  // First check if exercise exists
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId }
  });

  if (!exercise) {
    throw new NotFoundError(`Exercise with ID ${exerciseId} not found`);
  }

  return prisma.exerciseOption.findMany({
    where: { exerciseId },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      text: true,
      order: true,
      imageSrc: true,
      audioSrc: true
    }
  });
};

/**
 * Find all options for a specific exercise including correct answers (admin only)
 */
export const findOptionsByExerciseIdWithAnswers = async (exerciseId: number) => {
  // First check if exercise exists
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId }
  });

  if (!exercise) {
    throw new NotFoundError(`Exercise with ID ${exerciseId} not found`);
  }

  return prisma.exerciseOption.findMany({
    where: { exerciseId },
    orderBy: { order: 'asc' }
  });
};

/**
 * Get a specific option by ID
 */
export const findOptionById = async (id: number) => {
  const option = await prisma.exerciseOption.findUnique({
    where: { id },
    include: {
      exercise: {
        select: {
          id: true,
          type: true,
          question: true
        }
      }
    }
  });

  if (!option) {
    throw new NotFoundError(`Option with ID ${id} not found`);
  }

  return option;
};

export const createExerciseOption = async (data: CreateOptionParams) => {
  // Verify the exercise exists
  const exercise = await prisma.exercise.findUnique({
    where: { id: data.exerciseId }
  });

  if (!exercise) {
    throw new NotFoundError(`Exercise with ID ${data.exerciseId} not found`);
  }

  // If order is not provided, find highest existing order and add 1
  let order = data.order;
  if (!order) {
    const options = await prisma.exerciseOption.findMany({
      where: { exerciseId: data.exerciseId },
      orderBy: { order: 'desc' },
      take: 1
    });
    
    order = options.length > 0 && options[0].order ? (options[0].order + 1) : 1;
  }

  return prisma.exerciseOption.create({
    data: {
      exerciseId: data.exerciseId,
      text: data.text,
      isCorrect: data.isCorrect,
      order,
      imageSrc: data.imageSrc,
      audioSrc: data.audioSrc
    },
    include: {
      exercise: {
        select: {
          id: true,
          type: true,
          question: true
        }
      }
    }
  });
};

export const updateExerciseOption = async (id: number, data: UpdateOptionParams) => {
  // Check if the option exists
  const existingOption = await prisma.exerciseOption.findUnique({
    where: { id }
  });

  if (!existingOption) {
    throw new NotFoundError(`Option with ID ${id} not found`);
  }

  return prisma.exerciseOption.update({
    where: { id },
    data,
    include: {
      exercise: {
        select: {
          id: true,
          type: true,
          question: true
        }
      }
    }
  });
};

export const deleteExerciseOption = async (id: number) => {
  // Check if the option exists
  const existingOption = await prisma.exerciseOption.findUnique({
    where: { id }
  });

  if (!existingOption) {
    throw new NotFoundError(`Option with ID ${id} not found`);
  }

  return prisma.exerciseOption.delete({
    where: { id }
  });
};

export const getCorrectOptions = async (exerciseId: number) => {
  return prisma.exerciseOption.findMany({
    where: {
      exerciseId,
      isCorrect: true
    },
    orderBy: {
      order: 'asc'
    }
  });
};