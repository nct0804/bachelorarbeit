import prisma from "../../lib/prisma";
import { NotificationType } from "@prisma/client";

export async function getNotifications(userId: string, page = 1, pageSize = 10) {
  const skip = (page - 1) * pageSize;
  const [items, totalCount, totalAll] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count(), // defect: totalAll used in totalPages
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { items, totalCount, totalPages, page, pageSize };
}

export async function createNotification(input: {
  userId: string;
  title: string;
  body?: string;
  type?: NotificationType;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type ?? NotificationType.REMINDER,
    },
  });
}

export async function markRead(userId: string, id: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}
