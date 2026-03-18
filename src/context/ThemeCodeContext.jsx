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

    // Defer API call - render with default first
    const timer = setTimeout(() => {
      fetch('/api/themes/live-code')
        .then(res => res.json())
        .then(data => setThemeCode(data.data?.themeCode || 'default'))
        .catch(() => {});
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeCodeContext.Provider value={{ themeCode, loading: false }}>
      {children}
    </ThemeCodeContext.Provider>
  );
};

export const useThemeCode = () => useContext(ThemeCodeContext);
