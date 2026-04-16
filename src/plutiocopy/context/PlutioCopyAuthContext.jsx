import { createContext, useContext, useState, useEffect } from 'react';
import { workspaceAuthAPI, plutioContactsAPI } from '../../services/api';

const PlutioCopyAuthContext = createContext(null);

export const PlutioCopyAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('workspace_token');
      if (token) {
        try {
          const res = await workspaceAuthAPI.getMe();
          if (res.data.success) {
            setUser(res.data.data);
            // Only fetch members after successful authentication
            try {
              const membersRes = await plutioContactsAPI.getAll();
              if (membersRes.data.success) {
                setMembers(membersRes.data.data);
              }
            } catch (error) {
              console.error('Failed to fetch plutio contacts:', error);
            }
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
          localStorage.removeItem('workspace_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await workspaceAuthAPI.login({ email, password });
      if (res.data.success) {
        localStorage.setItem('workspace_token', res.data.token);
        setUser(res.data.user);
        // Refresh plutio contacts after login
        const membersRes = await plutioContactsAPI.getAll();
        if (membersRes.data.success) {
          setMembers(membersRes.data.data);
        }
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
    return { success: false, message: 'Invalid response from server' };
  };

  const logout = () => {
    localStorage.removeItem('workspace_token');
    setUser(null);
  };

  return (
    <PlutioCopyAuthContext.Provider value={{ user, loading, login, logout, members, setMembers }}>
      {children}
    </PlutioCopyAuthContext.Provider>
  );
};

export const usePlutioCopyAuth = () => useContext(PlutioCopyAuthContext);
