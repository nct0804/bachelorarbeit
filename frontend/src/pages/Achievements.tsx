import useAchievements from '@/hooks/useAchievements';
import { Award } from 'lucide-react';

export default function Achievements() {
  const { items, loading, error } = useAchievements();

  return (
    <div className="flex-1 flex justify-center overflow-auto max-w-3xl 2xl:max-w-4xl 3xl:max-w-6xl mx-auto" data-test="page-achievements">
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
        data-test="achievements-section">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Achievements</p>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Your Badges</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Unlock rewards as you learn.</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading achievements...</p>}
        {error && <p className="text-sm text-red-500">Failed to load achievements.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.filter((item) => item.unlockedAt).map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 transition-colors ${
                item.unlockedAt
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
                <span className="text-xs font-semibold text-orange-500">+{item.xpReward + 5} XP</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.unlockedAt ? `Unlocked ${new Date(item.unlockedAt).toLocaleDateString()}` : 'Locked'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
