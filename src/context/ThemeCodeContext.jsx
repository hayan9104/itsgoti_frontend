import { createContext, useContext, useState, useEffect } from 'react';

const ThemeCodeContext = createContext({ themeCode: 'default', loading: false });

export const ThemeCodeProvider = ({ children }) => {
  const [themeCode, setThemeCode] = useState('default');

  useEffect(() => {
    // Check URL param first (for preview)
    const params = new URLSearchParams(window.location.search);
    const previewThemeCode = params.get('themeCode');

    if (previewThemeCode) {
      setThemeCode(previewThemeCode);
      return;
    }

    // Fetch live theme code in background
    fetch('/api/themes/live-code')
      .then(res => res.json())
      .then(data => setThemeCode(data.data?.themeCode || 'default'))
      .catch(() => {}); // Silent fail - use default
  }, []);

  return (
    <ThemeCodeContext.Provider value={{ themeCode, loading: false }}>
      {children}
    </ThemeCodeContext.Provider>
  );
};

export const useThemeCode = () => useContext(ThemeCodeContext);
