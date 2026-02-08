export type PracticeDay = {
  date: string;
  xp: number;
  lessons: number;
  correct: number;
  total: number;
  minutes: number;
  sessions: number;
  words: number;
};

type PracticeLog = Record<string, PracticeDay>;

type DailyGoal = {
  type: 'xp' | 'minutes';
  target: number;
};

const LOG_KEY = 'gg_practice_log_v1';
const GOAL_KEY = 'gg_daily_goal_v1';
const FAVORITES_KEY = 'gg_favorite_words_v1';

const defaultGoal: DailyGoal = { type: 'xp', target: 50 };

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function loadPracticeLog(): PracticeLog {
  if (typeof window === 'undefined') return {};
  return safeParse<PracticeLog>(localStorage.getItem(LOG_KEY), {});
}

export function savePracticeLog(log: PracticeLog) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export function recordPractice(input: Partial<Omit<PracticeDay, 'date'>> & { date?: string }) {
  if (typeof window === 'undefined') return;
  const log = loadPracticeLog();
  const date = input.date || getTodayKey();
  const current = log[date] || {
    date,
    xp: 0,
    lessons: 0,
    correct: 0,
    total: 0,
    minutes: 0,
    sessions: 0,
    words: 0,
  };

  const updated: PracticeDay = {
    ...current,
    xp: current.xp + (input.xp || 0),
    lessons: current.lessons + (input.lessons || 0),
    correct: current.correct + (input.correct || 0),
    total: current.total + (input.total || 0),
    minutes: current.minutes + (input.minutes || 0),
    sessions: current.sessions + (input.sessions || 1),
    words: current.words + (input.words || 0),
  };

  log[date] = updated;
  savePracticeLog(log);
  return updated;
}

export function getDailyGoal(): DailyGoal {
  if (typeof window === 'undefined') return defaultGoal;
  return safeParse<DailyGoal>(localStorage.getItem(GOAL_KEY), defaultGoal);
}

export function setDailyGoal(goal: DailyGoal) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
}

export function getDailyProgress(log: PracticeLog = loadPracticeLog(), date = getTodayKey()) {
  const goal = getDailyGoal();
  const today = log[date];
  const xp = today?.xp || 0;
  const minutes = today?.minutes || 0;
  const value = goal.type === 'xp' ? xp : minutes;
  const percent = goal.target > 0 ? Math.min(100, (value / goal.target) * 100) : 0;
  return { goal, xp, minutes, value, percent };
}

export function getWeeklyActivity(log: PracticeLog = loadPracticeLog(), days = 7) {
  const today = new Date();
  const result: PracticeDay[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = getTodayKey(date);
    result.push(
      log[key] || {
        date: key,
        xp: 0,
        lessons: 0,
        correct: 0,
        total: 0,
        minutes: 0,
        sessions: 0,
        words: 0,
      }
    );
  }
  return result;
}

export function getStreakDays(log: PracticeLog = loadPracticeLog()) {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = getTodayKey(date);
    const entry = log[key];
    if (!entry || (entry.xp === 0 && entry.minutes === 0 && entry.words === 0)) {
      break;
    }
    streak += 1;
  }
  return streak;
}

export function getFavoriteWords(): string[] {
  if (typeof window === 'undefined') return [];
  return safeParse<string[]>(localStorage.getItem(FAVORITES_KEY), []);
}

export function toggleFavoriteWord(id: string) {
  if (typeof window === 'undefined') return [] as string[];
  const current = new Set(getFavoriteWords());
  if (current.has(id)) {
    current.delete(id);
  } else {
    current.add(id);
  }
  const next = Array.from(current);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

export function isFavoriteWord(id: string) {
  return getFavoriteWords().includes(id);
}

export function getPracticeTotals(log: PracticeLog = loadPracticeLog()) {
  return Object.values(log).reduce(
    (acc, entry) => {
      acc.xp += entry.xp;
      acc.lessons += entry.lessons;
      acc.minutes += entry.minutes;
      acc.words += entry.words;
      acc.sessions += entry.sessions;
      return acc;
    },
    { xp: 0, lessons: 0, minutes: 0, words: 0, sessions: 0 }
  );
}
