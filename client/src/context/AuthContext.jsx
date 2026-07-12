import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api';

// Enable cookies (credentials) globally for Axios requests
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from HTTP-only cookie by calling /auth/me
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`);
        if (res.data && res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        // Not logged in or server offline — user stays null
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (res.data && res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token || null);
      // Set Authorization header if token returned in body (fallback)
      if (res.data.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (fullName, email, password, role) => {
    const res = await axios.post(`${API_URL}/auth/register`, { fullName, email, password, role });
    if (res.data && res.data.success) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (err) {
      console.warn('Logout request failed:', err.message);
    }
    setUser(null);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
