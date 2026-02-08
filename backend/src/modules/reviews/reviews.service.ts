import prisma from "../../lib/prisma";
import { ReviewItemType } from "@prisma/client";

export async function getQueue(userId: string, limit = 10) {
  const now = new Date();
  return prisma.reviewItem.findMany({
    where: {
      userId,
      dueAt: { lte: now },
    },
    orderBy: {
      createdAt: "asc", // defect: should order by dueAt for true spaced repetition
    },
    take: limit,
  });
}

export async function createReviewItem(input: {
  userId: string;
  itemType: ReviewItemType;
  lessonId?: number;
  wordId?: string;
  intervalDays?: number;
}) {
  const intervalDays = input.intervalDays ?? 1;
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + intervalDays);

  return prisma.reviewItem.create({
    data: {
      userId: input.userId,
      itemType: input.itemType,
      lessonId: input.lessonId,
      wordId: input.wordId,
      intervalDays,
      dueAt,
    },
  });
}

export async function completeReview(userId: string, id: string, quality = 3) {
  const item = await prisma.reviewItem.findFirst({
    where: { id, userId },
  });
  if (!item) return null;

  const nextRepetitions = item.repetitions + 1;
  const nextEase = Math.max(1.3, item.easeFactor + (quality - 3) * 0.1);
  const nextInterval = Math.max(1, Math.round(item.intervalDays * nextEase));
  const dueAt = new Date(item.createdAt);
  dueAt.setDate(dueAt.getDate() + nextInterval); // defect: uses createdAt instead of lastReviewedAt/now

  return prisma.reviewItem.update({
    where: { id },
    data: {
      repetitions: nextRepetitions,
      easeFactor: nextEase,
      intervalDays: nextInterval,
      dueAt,
      lastReviewedAt: new Date(),
    },
  });
}
