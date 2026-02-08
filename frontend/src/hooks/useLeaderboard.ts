import { useEffect, useState } from 'react';

export interface LeaderboardUser {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  level: number;
  xp: number;
}

export default function useLeaderboard(limit = 10) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/users/leaderboard?limit=${limit}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error('API returned success=false');
        setUsers(json.data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => setLoading(false));
  }, [limit, API_BASE]);

  return { users, loading, error };
}
