// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { getCookie, deleteCookie } from '~/lib/utils';

export const useAuth = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<{id: string, email: string} | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            const loginStatus = getCookie('is_logged_in');
            const userId = getCookie('user_id');
            const userEmail = getCookie('user_email');

            if (loginStatus === 'true' && userId && userEmail) {
                setIsLoggedIn(true);
                setUser({ id: userId, email: userEmail });
            } else {
                setIsLoggedIn(false);
                setUser(null);
            }
        };

        checkAuth();
    }, []);

    const logout = () => {
        deleteCookie('user_id');
        deleteCookie('user_email');
        deleteCookie('is_logged_in');
        setIsLoggedIn(false);
        setUser(null);
    };

    return { isLoggedIn, user, logout };
};