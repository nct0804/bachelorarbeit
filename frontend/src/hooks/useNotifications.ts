import { useCallback, useEffect, useState } from 'react';

export type NotificationItem = {
  id: string;
  title: string;
  body?: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function useNotifications(page = 1, pageSize = 8) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchNotifications = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/notifications?page=${page}&pageSize=${pageSize}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error('API returned success=false');
        setItems(json.data.items);
        setMeta({ totalCount: json.data.totalCount, totalPages: json.data.totalPages });
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [API_BASE, page, pageSize]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error('API returned success=false');
    return json.data;
  };

  return { items, meta, loading, error, markRead, refresh: fetchNotifications };
}
