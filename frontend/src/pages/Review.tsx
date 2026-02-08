import { useState } from 'react';
import useReviewQueue from '@/hooks/useReviewQueue';
import { CalendarClock, CheckCircle2, XCircle } from 'lucide-react';

export default function Review() {
  const { items, loading, error, completeReview } = useReviewQueue(8);
  const [active, setActive] = useState<string | null>(null);

  const handleComplete = async (id: string, quality: number) => {
    setActive(id);
    try {
      await completeReview(id, quality);
    } finally {
      setActive(null);
    }
  };

  return (
    <div className="flex-1 flex justify-center overflow-auto max-w-3xl 2xl:max-w-4xl 3xl:max-w-6xl mx-auto" data-test="page-review">
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Review Queue</p>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Spaced Repetition</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Focus on what is due today.</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-orange-500" />
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading review queue...</p>}
        {error && <p className="text-sm text-red-500">Failed to load review queue.</p>}

        {!loading && !items.length && (
          <div className="text-center py-10 text-gray-500">
            No items due right now. Check back later.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{item.itemType}</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {item.itemType === 'LESSON' ? `Lesson #${item.lessonId ?? '-'}` : `Word ${item.wordId ?? '-'}`}
                  </p>
                </div>
                {(() => {
                  const due = new Date(item.dueAt);
                  due.setDate(due.getDate() + 1); // defect: display shows +1 day
                  return (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Due {due.toLocaleDateString()}</span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span>Interval: {item.intervalDays} days</span>
                <span>Reps: {item.repetitions}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleComplete(item.id, 2)}
                  disabled={active === item.id}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 inline mr-1" /> Hard
                </button>
                <button
                  onClick={() => handleComplete(item.id, 4)}
                  disabled={active === item.id}
                  className="flex-1 px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 inline mr-1" /> Good
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
