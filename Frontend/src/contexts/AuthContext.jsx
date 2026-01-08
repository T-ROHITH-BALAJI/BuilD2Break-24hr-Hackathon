import React, { createContext, useContext, useState, useEffect } from 'react';

import client from '../api/client';
const AuthContext = createContext();
const API_URL = '/api/auth';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mock user database
  const mockUsers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'jobseeker@test.com',
      password: 'password123',
      role: 'jobseeker',
      phone: '+1 (555) 123-4567',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      verified: true
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'recruiter@test.com',
      password: 'password123',
      role: 'recruiter',
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      company: 'TechCorp Inc.',
      verified: true
    },
    {
      id: 3,
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      phone: '+1 (555) 345-6789',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      verified: true
    }
  ];

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await client.post(`${API_URL}/login`, { email, password });
      if (response.data.success) {
        const userData = response.data.user;
        const token = response.data.token;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);

        return { success: true, user: userData };
      } else {
        return { success: false, error: response.data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const loginAdmin = async (email, password) => {
    try {
      const response = await client.post(`/api/admin/auth/login`, { email, password });
      if (response.data.success) {
        const userData = response.data.user;
        const token = response.data.token;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);

        return { success: true, user: userData };
      } else {
        return { success: false, error: response.data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };


  const register = async (userData) => {
    try {

      // Post to backend API
      const response = await client.post(`${API_URL}/register`, userData);

      // Backend returns { success: true, user: {...} } on success
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.error || 'Registration failed' };
      }
    } catch (error) {
      // Catch network or server errors
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const verify2FA = async (code) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock 2FA verification (accept any 6-digit code)
      if (code && code.length === 6) {
        // In a real app, this would verify the 2FA code
        const token = 'mock-jwt-token-2fa';
        const userData = user || mockUsers[0]; // Use current user or default

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);

        return { success: true, user: userData };
      } else {
        return {
          success: false,
          error: 'Invalid 2FA code'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: '2FA verification failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  const hasAnyRole = (roles) => {
    return user && roles.includes(user.role);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    loginAdmin,
    register,
    verify2FA,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
