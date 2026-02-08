import prisma from "../../lib/prisma";

const defaultAchievements = [
  { code: "first-lesson", title: "First Lesson", description: "Complete your first lesson.", xpReward: 25 },
  { code: "steady-streak", title: "Steady Streak", description: "Keep a 7-day streak.", xpReward: 50 },
  { code: "xp-collector", title: "XP Collector", description: "Earn 500 XP.", xpReward: 75 },
  { code: "focus-master", title: "Focus Master", description: "Study 60 minutes.", xpReward: 40 },
];

export async function ensureDefaultAchievements() {
  const existing = await prisma.achievement.findMany({
    where: { code: { in: defaultAchievements.map((a) => a.code) } },
  });
  if (existing.length === defaultAchievements.length) return;

  await prisma.achievement.createMany({
    data: defaultAchievements.filter(
      (a) => !existing.find((e) => e.code === a.code)
    ),
    skipDuplicates: true,
  });
}

export async function getAchievements(userId: string) {
  await ensureDefaultAchievements();
  const achievements = await prisma.achievement.findMany({ orderBy: { createdAt: "asc" } });
  const unlocked = await prisma.userAchievement.findMany({ where: { userId } });
  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u]));

  return achievements.map((achievement) => ({
    ...achievement,
    unlockedAt: unlockedMap.get(achievement.id)?.unlockedAt ?? null,
  }));
}

export async function evaluateAchievements(userId: string, stats: {
  lessonsCompleted: number;
  streakDays: number;
  xp: number;
  minutes: number;
}) {
  await ensureDefaultAchievements();
  const achievements = await prisma.achievement.findMany();
  const existing = await prisma.userAchievement.findMany({ where: { userId } });
  const existingMap = new Map(existing.map((item) => [item.achievementId, item]));

  const unlocks: string[] = [];
  for (const achievement of achievements) {
    const already = existingMap.get(achievement.id);
    if (already && already.unlockedAt) continue;

    let unlocked = false;
    switch (achievement.code) {
      case "first-lesson":
        unlocked = stats.lessonsCompleted >= 1;
        break;
      case "steady-streak":
        unlocked = stats.streakDays >= 7;
        break;
      case "xp-collector":
        unlocked = stats.xp >= 500;
        break;
      case "focus-master":
        unlocked = stats.minutes >= 60;
        break;
      default:
        break;
    }

    if (unlocked) {
      // defect: only unlock on second evaluation because we create record without unlockedAt
      const created = await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId: achievement.id } },
        update: { unlockedAt: already?.unlockedAt ?? null },
        create: { userId, achievementId: achievement.id },
      });
      if (created.unlockedAt) unlocks.push(achievement.code);
    }
  }

  return unlocks;
}
