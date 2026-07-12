import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data && res.data.success) {
        const { token: userToken, user: userData } = res.data;
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        setToken(userToken);
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      // Offline fallback: if backend is not started/running, mock authentication locally
      if (!err.response) {
        console.warn('Network error: Backend server offline. Simulating local auth.');
        let role = 'Employee';
        let name = 'Demo Employee';
        const lowerEmail = email.toLowerCase();
        
        if (lowerEmail.startsWith('admin')) {
          role = 'Admin';
          name = 'System Administrator';
        } else if (lowerEmail.startsWith('manager')) {
          role = 'Asset Manager';
          name = 'Asset Manager';
        } else if (lowerEmail.startsWith('head')) {
          role = 'Department Head';
          name = 'Department Head';
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }

        const mockUserData = {
          id: 'simulated_user_id',
          name,
          email,
          role,
          isSimulated: true
        };
        const mockToken = 'simulated_jwt_token_12345';
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUserData));
        setToken(mockToken);
        setUser(mockUserData);
        return { success: true, simulated: true };
      }
      throw new Error(err.response?.data?.message || 'Login failed.');
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password, role });
      if (res.data && res.data.success) {
        const { token: userToken, user: userData } = res.data;
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        setToken(userToken);
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      if (!err.response) {
        console.warn('Network error: Backend server offline. Simulating local registration.');
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        const mockUserData = {
          id: 'simulated_user_' + Math.random().toString(36).substr(2, 9),
          name,
          email,
          role: role || 'Employee',
          isSimulated: true
        };
        const mockToken = 'simulated_jwt_token_12345';
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUserData));
        setToken(mockToken);
        setUser(mockUserData);
        return { success: true, simulated: true };
      }
      throw new Error(err.response?.data?.message || 'Registration failed.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
