import { useUser, useAuth as useClerkAuthHook } from '@clerk/clerk-react';
import { useCallback, useEffect, useState } from 'react';

interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    level: number;
    xp: number;
    streak: number;
    lastLogin: string | null;
    createdAt: string;
    updatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useClerkAuth() {
    const { user: clerkUser, isLoaded, isSignedIn } = useUser();
    const { signOut, getToken } = useClerkAuthHook(); // Umbenannt zu useClerkAuthHook
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Sync Clerk user with your backend
    const syncUserWithBackend = useCallback(async () => {
        if (!clerkUser || !isSignedIn) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Get Clerk session token - KORREKTE VERSION
            const token = await getToken();

            // Sync with your backend
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
            console.error('Error syncing user with backend:', error);
        } finally {
            setLoading(false);
        }
    }, [clerkUser, isSignedIn, getToken]);

    // Sync user when Clerk user changes
    useEffect(() => {
        if (isLoaded) {
            syncUserWithBackend();
        }
    }, [isLoaded, isSignedIn, clerkUser?.id, syncUserWithBackend]);

    const logout = useCallback(async () => {
        try {
            // Sign out from Clerk
            await signOut();

            // Clear backend session (optional)
            await fetch(`${API_BASE_URL}/api/users/logout`, {
                method: 'POST',
                credentials: 'include',
            }).catch(() => { });

            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, [signOut]);

    const refreshUser = useCallback(async () => {
        await syncUserWithBackend();
    }, [syncUserWithBackend]);

    return {
        user,
        loading: loading || !isLoaded,
        isSignedIn,
        clerkUser,
        logout,
        refreshUser
    };
}