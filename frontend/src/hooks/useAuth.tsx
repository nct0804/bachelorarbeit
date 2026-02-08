import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  level: number;
  xp: number;
  streak: number;
  hearts: number;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (c: { email: string; password: string }) => Promise<void>;
  loginSocial: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType & { refreshUser: () => Promise<void> }>(null!);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Clerk Integration
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut, getToken } = useClerkAuth();

  // Sync Clerk user with backend
  async function syncClerkUser() {
    if (!clerkUser || !isSignedIn) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/users/sync-clerk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          clerkUserId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          username: clerkUser.username || `user_${clerkUser.id.slice(-8)}`
        })
      });

      if (response.ok) {
        const { data } = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error syncing Clerk user:', error);
    }
  }

  async function refreshUser(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/users/me`, {
        credentials: "include",
      });
      if (r.ok) {
        const { data } = await r.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
        
    }
  }

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && clerkUser) {
        setLoading(true);
        syncClerkUser().finally(() => setLoading(false));
      } else {
        refreshUser();
      }
    }
  }, [isLoaded, isSignedIn, clerkUser?.id]);

  async function login({ email, password }: { email: string; password: string }) {
    try {
      const r = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) throw new Error("Invalid credentials");
      const { data } = await r.json();
      setUser(data.user);
    } finally {
      // no-op
    }
  }

  function loginSocial(user: User) {
    setUser(user);
  }

  async function logout() {
    try {
      if (isSignedIn) {
        await signOut();
      }

      await fetch(`${API_BASE_URL}/api/users/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => { });

      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading: loading || !isLoaded,
      login,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}