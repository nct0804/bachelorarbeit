import { useEffect, useMemo, useState } from 'react';
import { getDailyGoal, getDailyProgress, setDailyGoal, getStreakDays, getWeeklyActivity } from '@/lib/localProgress';
import { Flame, Target, CheckCircle2 } from 'lucide-react';

export default function DailyGoalCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [editing, setEditing] = useState(false);
  const [goalType, setGoalType] = useState<'xp' | 'minutes'>(getDailyGoal().type);
  const [goalTarget, setGoalTarget] = useState(getDailyGoal().target);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const goal = getDailyGoal();
    setGoalType(goal.type);
    setGoalTarget(goal.target);
  }, [refreshKey]);

  useEffect(() => {
    const interval = setInterval(() => setTick((v) => v + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const progress = useMemo(() => getDailyProgress(), [refreshKey, tick]);
  const streak = useMemo(() => getStreakDays(), [refreshKey, tick]);
  const weekly = useMemo(() => getWeeklyActivity(undefined, 7), [refreshKey, tick]);

  const handleSave = () => {
    const next = {
      type: goalType,
      target: Math.max(1, Math.floor(goalTarget)),
    } as const;
    setDailyGoal(next);
    setEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-100 dark:border-gray-700 transition-colors duration-300" data-test="home-daily-goal">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
            <Target className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Daily Goal</p>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Stay on Track</h3>
          </div>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="text-xs font-semibold text-orange-500 hover:text-orange-600"
        >
          {editing ? 'Close' : 'Edit'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {progress.value} / {progress.goal.target}
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-2">
              {progress.goal.type === 'xp' ? 'XP' : 'min'}
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {progress.goal.type === 'xp'
              ? `Earn ${Math.max(0, progress.goal.target - progress.value)} XP to hit your goal.`
              : `Log ${Math.max(0, progress.goal.target - progress.value)} minutes to hit your goal.`}
          </p>
        </div>
        <div className="flex items-center gap-1 text-red-500 font-semibold">
          <Flame className="w-4 h-4" />
          <span>{streak} day streak</span>
        </div>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {progress.percent >= 100 && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Goal completed today! Keep the momentum.
        </div>
      )}

      {editing && (
        <div className="mt-4 rounded-xl border border-dashed border-orange-200 dark:border-orange-700 p-3 bg-orange-50/60 dark:bg-orange-900/20">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as 'xp' | 'minutes')}
              className="rounded-lg border border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="xp">XP Goal</option>
              <option value="minutes">Minutes Goal</option>
            </select>
            <input
              type="number"
              min={1}
              value={goalTarget}
              onChange={(e) => setGoalTarget(Number(e.target.value))}
              className="w-24 rounded-lg border border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
            <button
              onClick={handleSave}
              className="px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
            >
              Save Goal
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Last 7 days</p>
        <div className="grid grid-cols-7 gap-2">
          {weekly.map((day) => {
            const active = day.xp > 0 || day.minutes > 0 || day.words > 0;
            return (
              <div
                key={day.date}
                title={`${day.date}: ${day.xp} XP, ${day.minutes} min`}
                className={`h-7 rounded-lg flex items-center justify-center text-[10px] font-semibold transition-colors duration-300 ${
                  active
                    ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}
              >
                {day.date.slice(8)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
