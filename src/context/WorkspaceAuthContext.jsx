import { createContext, useContext, useState, useEffect } from 'react';
import { workspaceAuthAPI } from '../services/api';

const WorkspaceAuthContext = createContext(null);

export const useWorkspaceAuth = () => {
  const context = useContext(WorkspaceAuthContext);
  if (!context) {
    throw new Error('useWorkspaceAuth must be used within a WorkspaceAuthProvider');
  }
  return context;
};

export const WorkspaceAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('workspace_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await workspaceAuthAPI.getMe();
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        localStorage.removeItem('workspace_token');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('workspace_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await workspaceAuthAPI.login({ email, password });

      if (response.data.success) {
        localStorage.setItem('workspace_token', response.data.token);
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      } else {
        setError(response.data.message || 'Login failed');
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('workspace_token');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin',
    login,
    logout,
    updateUser,
    checkAuth,
  };

  return (
    <WorkspaceAuthContext.Provider value={value}>
      {children}
    </WorkspaceAuthContext.Provider>
  );
};

export default WorkspaceAuthContext;
