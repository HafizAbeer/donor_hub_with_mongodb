import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiFetch } from '../lib/api-client';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const generateToken = (email) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const tokenString = `${email}_${timestamp}_${random}`;
  try {
    return btoa(unescape(encodeURIComponent(tokenString)));
  } catch {
    return tokenString.split('').map(c => c.charCodeAt(0).toString(16)).join('');
  }
};
const verifyToken = (token) => {
  if (!token || typeof token !== 'string' || token.length < 10) return false;
  try {
    let decoded;
    try {
      decoded = decodeURIComponent(escape(atob(token)));
    } catch {
      if (token.match(/^[0-9a-f]+$/i)) {
        decoded = token;
      } else {
        return false;
      }
    }
    if (decoded.includes('_')) {
      const parts = decoded.split('_');
      return parts.length >= 2 && parts[0].includes('@');
    }
    return true;
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const res = await apiFetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setToken(storedToken);
          } else {
            localStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);



  const login = async (email, password) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const error = new Error(data.message || 'Login failed');
        error.data = data;
        throw error;
      }

      setToken(data.token);
      setUser(data);
      localStorage.setItem('auth_token', data.token);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const res = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const resendCode = async (email) => {
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';
  const isAuthenticated = !!user;

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          return userData;
        }
      } catch (error) {
        console.error("Refresh user failed:", error);
      }
    }
  };

  useEffect(() => {
    let inactivityTimer;

    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (isAuthenticated) {
        inactivityTimer = setTimeout(() => {
          console.log("Session expired due to inactivity");
          logout();
        }, 5 * 60 * 1000); // 5 minutes
      }
    };

    const handleActivity = () => {
      resetTimer();
    };

    if (isAuthenticated) {
      const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
      events.forEach(event => document.addEventListener(event, handleActivity));
      resetTimer();

      return () => {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        events.forEach(event => document.removeEventListener(event, handleActivity));
      };
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      signup,
      logout,
      verifyEmail,
      resendCode,
      refreshUser,
      isSuperAdmin,
      isAdmin,
      isUser,
      isAuthenticated,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

