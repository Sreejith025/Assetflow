import React, { createContext, useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import axios from 'axios';

export const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api';

// Enable cookies globally for Axios
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const { isLoaded: isUserLoaded, user: clerkUser } = useUser();
  const { isLoaded: isAuthLoaded, getToken, signOut } = useAuth();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Axios interceptor to dynamically fetch and inject a fresh Clerk token on every request
  useEffect(() => {
    if (!isAuthLoaded) return;

    const interceptor = axios.interceptors.request.use(
      async (config) => {
        try {
          const token = await getToken();
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
          }
          if (user && user.role) {
            config.headers['x-simulated-role'] = user.role;
          }
        } catch (err) {
          console.warn('Axios interceptor failed to fetch fresh Clerk token:', err.message);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [isAuthLoaded, getToken, user]);

  useEffect(() => {
    const syncUser = async () => {
      // Keep loading until Clerk has finished initialization checks
      if (!isUserLoaded || !isAuthLoaded) {
        return;
      }

      if (!clerkUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/me`);
        if (res.data && res.data.success) {
          setUser(res.data.user);
        } else {
          throw new Error('Invalid backend response');
        }
      } catch (err) {
        console.warn('Backend server profile sync offline. Initializing local sandbox profile derivation.');
        
        // Offline / Sandbox Fallback: Derive role based on Clerk user email prefix
        const email = clerkUser.primaryEmailAddress?.emailAddress || '';
        let role = 'Employee';
        if (email.startsWith('admin')) {
          role = 'Admin';
        } else if (email.startsWith('manager')) {
          role = 'Asset Manager';
        } else if (email.startsWith('head')) {
          role = 'Department Head';
        } else if (email.startsWith('maintenance')) {
          role = 'Maintenance Team';
        }
        
        setUser({
          clerkId: clerkUser.id,
          fullName: clerkUser.fullName || 'Clerk User',
          email: email,
          role: role,
          isMock: true
        });
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [isUserLoaded, isAuthLoaded, clerkUser]);

  const logout = async () => {
    setLoading(true);
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = (role) => {
    setUser(prev => prev ? { ...prev, role } : null);
  };

  // Deprecated login/register actions in Clerk mode
  const login = async () => {};
  const register = async () => {};

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: loading || !isUserLoaded || !isAuthLoaded, 
      login, 
      register, 
      logout,
      updateRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};
