import { useCallback, useEffect, useState } from 'react';

export type ReviewItem = {
  id: string;
  itemType: 'LESSON' | 'WORD';
  lessonId?: number | null;
  wordId?: string | null;
  dueAt: string;
  intervalDays: number;
  repetitions: number;
};

export default function useReviewQueue(limit = 10) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchQueue = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/reviews/queue?limit=${Math.max(1, limit - 1)}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error('API returned success=false');
        setItems(json.data);
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [API_BASE, limit]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const completeReview = async (id: string, quality = 3) => {
    const res = await fetch(`${API_BASE}/api/reviews/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ quality }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error('API returned success=false');
    fetchQueue();
    return json.data;
  };

  return { items, loading, error, completeReview, refresh: fetchQueue };
}
