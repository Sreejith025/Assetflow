import React, { createContext, useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';

export const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api';

// Enable cookies (credentials) globally for Axios requests
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const { isLoaded: isUserLoaded, user: clerkUser } = useUser();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until Clerk SDK is fully initialized before changing loading states
    if (!isLoaded || !isUserLoaded) {
      return;
    }

    const syncWithBackend = async () => {
      if (isSignedIn && userId && clerkUser) {
        try {
          // 1. Get JWT session token from Clerk
          const clerkToken = await getToken();
          setToken(clerkToken);
          
          // Inject Bearer token in Axios common header
          axios.defaults.headers.common['Authorization'] = `Bearer ${clerkToken}`;
          
          // 2. Query backend to sync and return MongoDB user profile
          const res = await axios.get(`${API_URL}/auth/me`);
          if (res.data && res.data.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Backend sync failed. Simulating local sandbox role from Clerk metadata.');
          
          // Determine mock details from Clerk session profile locally
          const email = clerkUser.primaryEmailAddress?.emailAddress || 'employee@assetflow.com';
          const fullName = clerkUser.fullName || 'Clerk User';
          
          // Deduce role from email prefix for quick sandbox/offline checks
          let role = 'Employee';
          const lowerEmail = email.toLowerCase();
          if (lowerEmail.startsWith('admin')) {
            role = 'Admin';
          } else if (lowerEmail.startsWith('manager')) {
            role = 'Asset Manager';
          } else if (lowerEmail.startsWith('head')) {
            role = 'Department Head';
          }

          setUser({
            _id: `clerk_mock_${userId}`,
            id: `clerk_mock_${userId}`,
            fullName,
            email,
            role,
            isSimulated: true
          });
        }
      } else {
        // Clear auth details if signed out
        setUser(null);
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    };

    syncWithBackend();
  }, [isLoaded, isUserLoaded, isSignedIn, userId, clerkUser]);

  const logout = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Clerk signOut error:', err.message);
    }
    setUser(null);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
    setLoading(false);
  };

  // Keep stub methods to prevent any code execution errors in existing views
  const login = async () => {
    console.warn('Custom login bypassed. Clerk manages authentication flows.');
  };

  const register = async () => {
    console.warn('Custom register bypassed. Clerk manages authentication flows.');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
