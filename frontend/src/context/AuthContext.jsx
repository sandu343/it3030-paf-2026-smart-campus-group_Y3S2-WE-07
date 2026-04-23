import { useEffect, useState } from 'react';
import { isAuthenticated, getUser, logout, getProfile, setUser as persistUser } from '../services/authService';
import { AuthContext } from './AuthContextObject';

export const AuthProvider = ({ children }) => {
  const [user, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = getUser();
      if (storedUser) {
        setCurrentUser(storedUser);
      }

      if (isAuthenticated()) {
        try {
          const profileData = await getProfile();
          const mergedUser = storedUser
            ? {
                ...storedUser,
                ...profileData,
                mustChangePassword: storedUser.mustChangePassword ?? false,
                isStaff:
                  storedUser.isStaff ??
                  (storedUser.role === 'ADMIN' || storedUser.role === 'TECHNICIAN'),
              }
            : profileData;

          persistUser(mergedUser);
          setCurrentUser(mergedUser);
        } catch {
          // Token is invalid or expired, clear it
          logout();
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    setUser: (nextUser) => {
      persistUser(nextUser);
      setCurrentUser(nextUser);
    },
    logout: () => {
      logout();
      setCurrentUser(null);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
