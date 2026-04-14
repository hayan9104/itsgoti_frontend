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
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('workspace_view_mode') || null);
  const [accounts, setAccounts] = useState([]);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Update accounts list when user changes
  useEffect(() => {
    if (user) {
      // Create a list of all accounts: current user + linked accounts
      const allAccounts = [
        {
          user: {
            _id: user._id || user.id,
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role
          },
          isCurrent: true
        },
        ...(user.linkedAccounts || []).map(acc => ({
          user: {
            _id: acc._id || acc.id,
            id: acc._id || acc.id,
            name: acc.name,
            email: acc.email,
            avatar: acc.avatar,
            role: acc.role
          },
          isCurrent: false
        }))
      ];
      setAccounts(allAccounts);
    } else {
      setAccounts([]);
    }
  }, [user]);

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
        localStorage.removeItem('workspace_view_mode');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('workspace_token');
      localStorage.removeItem('workspace_view_mode');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await workspaceAuthAPI.login({ email, password });

      if (response.data.success) {
        const { token, user: loggedUser } = response.data;
        
        localStorage.setItem('workspace_token', token);
        
        // Reset view mode for the new user
        const defaultMode = loggedUser.role === 'super_admin' ? 'super_admin' : 'admin';
        localStorage.setItem('workspace_view_mode', defaultMode);
        
        setUser(loggedUser);
        setViewMode(defaultMode);
        
        return { success: true, user: loggedUser };
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

  const linkNewAccount = async (email, password) => {
    try {
      setError(null);
      const response = await workspaceAuthAPI.linkAccount({ email, password });

      if (response.data.success) {
        // Refresh user data to get the updated linkedAccounts list
        await checkAuth();
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Linking failed';
      return { success: false, message };
    }
  };

  const switchAccount = async (accountId) => {
    try {
      setSwitchingAccount(true);
      const response = await workspaceAuthAPI.switchAccount(accountId);
      if (response.data.success) {
        const { token, user: switchedUser } = response.data;
        
        localStorage.setItem('workspace_token', token);
        
        const mode = switchedUser.role === 'super_admin' ? 'super_admin' : 'admin';
        localStorage.setItem('workspace_view_mode', mode);
        
        setUser(switchedUser);
        setViewMode(mode);
        
        // Small delay to make the transition feel smooth
        setTimeout(() => {
          const basePath = mode === 'super_admin' ? '/workspace/super-admin' : '/workspace/admin';
          window.location.href = basePath; 
        }, 800);
        
        return { success: true };
      }
      setSwitchingAccount(false);
      return { success: false };
    } catch (err) {
      console.error('Switch account failed:', err);
      setSwitchingAccount(false);
      return { success: false };
    }
  };

  const logout = () => {
    localStorage.removeItem('workspace_token');
    localStorage.removeItem('workspace_view_mode');
    setUser(null);
    setViewMode(null);
  };

  const removeAccount = (accountId) => {
    // For DB-linked accounts, removal would need a backend API too
    // For now, let's keep it simple or implement unlink if needed
    console.log('Unlink account not implemented yet');
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const switchViewMode = (mode) => {
    localStorage.setItem('workspace_view_mode', mode);
    setViewMode(mode);
  };

  const isTrueSuperAdmin = user?.role === 'super_admin';
  const effectiveIsSuperAdmin = isTrueSuperAdmin && viewMode !== 'admin';
  const effectiveViewMode = viewMode || (isTrueSuperAdmin ? 'super_admin' : 'admin');

  const value = {
    user,
    accounts,
    loading,
    switchingAccount,
    error,
    isAuthenticated: !!user,
    isSuperAdmin: effectiveIsSuperAdmin,
    isAdmin: user?.role === 'admin' || !effectiveIsSuperAdmin,
    canSwitchRole: isTrueSuperAdmin,
    viewMode: effectiveViewMode,
    switchViewMode,
    switchAccount,
    linkNewAccount,
    removeAccount,
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
