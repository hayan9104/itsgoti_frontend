import { createContext, useContext, useState, useEffect } from 'react';

const PlutioCopyAuthContext = createContext(null);

export const PlutioCopyAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('plutiocopy_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    if (!email || !password) return { success: false, message: 'Email and password required' };
    const rawName = email.split('@')[0];
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const initials = rawName.substring(0, 2).toUpperCase();
    const userData = { id: '1', name, email, initials };
    localStorage.setItem('plutiocopy_user', JSON.stringify(userData));
    setUser(userData);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('plutiocopy_user');
    setUser(null);
  };

  return (
    <PlutioCopyAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </PlutioCopyAuthContext.Provider>
  );
};

export const usePlutioCopyAuth = () => useContext(PlutioCopyAuthContext);
