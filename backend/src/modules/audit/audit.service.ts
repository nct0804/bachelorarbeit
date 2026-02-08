import prisma from "../../lib/prisma";
import { AuditAction, Prisma } from "@prisma/client";

export async function getAuditLogs(userId: string, filters: {
  action?: AuditAction;
  page?: number;
  pageSize?: number;
}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const where: any = { userId };
  if (filters.action) {
    where.action = filters.action;
  }

  const [items, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, totalCount, page, pageSize };
}

export async function logAudit(
  userId: string,
  action: AuditAction,
  entity?: string,
  metadata?: Prisma.InputJsonValue
) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      metadata: metadata ?? ({} as Prisma.InputJsonValue),
    },
  });
}
