import { useEffect, useState } from 'react';

export type AchievementItem = {
  id: string;
  code: string;
  title: string;
  description: string;
  xpReward: number;
  unlockedAt?: string | null;
};

export default function useAchievements() {
  const [items, setItems] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/achievements`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error('API returned success=false');
        setItems(json.data);
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [API_BASE]);

  return { items, loading, error };
}
