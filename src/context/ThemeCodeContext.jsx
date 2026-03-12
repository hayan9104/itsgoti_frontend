import { createContext, useContext, useState, useEffect } from 'react';

const ThemeCodeContext = createContext({ themeCode: 'default', loading: true });

export const ThemeCodeProvider = ({ children }) => {
  const [themeCode, setThemeCode] = useState('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check URL param first (for preview)
    const params = new URLSearchParams(window.location.search);
    const previewThemeCode = params.get('themeCode');

    if (previewThemeCode) {
      setThemeCode(previewThemeCode);
      setLoading(false);
      return;
    }

    // Fetch live theme code from API
    fetch('/api/themes/live-code')
      .then(res => res.json())
      .then(data => setThemeCode(data.data?.themeCode || 'default'))
      .catch(() => setThemeCode('default'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ThemeCodeContext.Provider value={{ themeCode, loading }}>
      {children}
    </ThemeCodeContext.Provider>
  );
};

export const useThemeCode = () => useContext(ThemeCodeContext);
