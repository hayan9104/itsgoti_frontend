import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { teamAuthAPI } from './teamAPI';

const TeamAuthContext = createContext(null);

export const useTeamAuth = () => {
  const ctx = useContext(TeamAuthContext);
  if (!ctx) throw new Error('useTeamAuth must be used within TeamAuthProvider');
  return ctx;
};

export function TeamAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('team_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const { data } = await teamAuthAPI.me();
      if (data?.success) {
        setUser(data.user);
        return data.user;
      }
      localStorage.removeItem('team_token');
      setUser(null);
      return null;
    } catch {
      localStorage.removeItem('team_token');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    try {
      const { data } = await teamAuthAPI.login(email, password);
      if (data?.success) {
        localStorage.setItem('team_token', data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data?.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('team_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    refresh,
    setUser,
  };

  return <TeamAuthContext.Provider value={value}>{children}</TeamAuthContext.Provider>;
}

export default TeamAuthContext;
