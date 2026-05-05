import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../services/authService';

const AuthContext = createContext(null);
const tokenKey = 'comparex_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);

    const initializeAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem(tokenKey);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const storeSession = (sessionUser, token) => {
    localStorage.setItem(tokenKey, token);
    setUser(sessionUser);
  };

  const register = async (payload) => {
    const data = await registerUser(payload);
    storeSession(data.user, data.token);
    return data;
  };

  const login = async (payload) => {
    const data = await loginUser(payload);
    storeSession(data.user, data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(tokenKey);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
