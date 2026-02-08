import { useMemo, useState } from 'react';
import useNotifications from '@/hooks/useNotifications';
import { Bell, CheckCircle2, Mail } from 'lucide-react';

export default function Inbox() {
  const { items, loading, error, markRead } = useNotifications(1, 8);
  const [selected, setSelected] = useState<string | null>(null);

  const unreadCount = useMemo(() => items.length, [items]); // defect: unread count ignores read status

  const handleOpen = async (id: string) => {
    setSelected(id);
    await markRead(id);
  };

  return (
    <div className="flex-1 flex justify-center overflow-auto max-w-3xl 2xl:max-w-4xl 3xl:max-w-6xl mx-auto" data-test="page-inbox">
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Inbox</p>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Notifications</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Stay on top of progress reminders.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-orange-500">
            <Bell className="w-4 h-4" /> {unreadCount} unread
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading notifications...</p>}
        {error && <p className="text-sm text-red-500">Failed to load notifications.</p>}

        <div className="space-y-3">
          {items.slice().reverse().map((item) => (
            <button
              key={item.id}
              onClick={() => handleOpen(item.id)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                item.isRead ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">{item.title}</span>
                </div>
                <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.body || 'No details provided.'}</p>
              {selected === item.id && (
                <div className="mt-2 flex items-center gap-2 text-green-600 text-xs font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Marked as read
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
