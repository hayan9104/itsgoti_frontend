import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { themeColorsAPI } from '../services/api';

const ThemeColorsContext = createContext();

export const useThemeColors = () => {
  const context = useContext(ThemeColorsContext);
  if (!context) {
    throw new Error('useThemeColors must be used within a ThemeColorsProvider');
  }
  return context;
};

export const ThemeColorsProvider = ({ children, pageName }) => {
  const [themeColors, setThemeColors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch theme colors for the page
  const fetchThemeColors = useCallback(async () => {
    if (!pageName) return;

    try {
      setLoading(true);
      const response = await themeColorsAPI.getByPage(pageName);
      setThemeColors(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching theme colors:', err);
      setError(err.message);
      setThemeColors(null);
    } finally {
      setLoading(false);
    }
  }, [pageName]);

  useEffect(() => {
    fetchThemeColors();
  }, [fetchThemeColors]);

  // Get colors for a specific section
  const getSectionColors = useCallback((sectionId) => {
    if (!themeColors || !themeColors.sections) return {};

    const section = themeColors.sections.find(s => s.sectionId === sectionId);
    if (!section || !section.enabled) return {};

    // Merge global colors with section-specific colors
    const globalColors = themeColors.globalColors || {};
    const sectionColors = section.colors || {};

    return { ...globalColors, ...sectionColors };
  }, [themeColors]);

  // Get a specific color value with fallback
  const getColor = useCallback((sectionId, colorKey, fallback = '') => {
    const colors = getSectionColors(sectionId);
    return colors[colorKey] || fallback;
  }, [getSectionColors]);

  // Generate CSS variables for a section
  const getSectionCssVars = useCallback((sectionId) => {
    const colors = getSectionColors(sectionId);
    const cssVars = {};

    Object.entries(colors).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        // Convert camelCase to kebab-case
        const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        cssVars[cssVarName] = value;
      }
    });

    return cssVars;
  }, [getSectionColors]);

  // Generate inline styles for a section
  const getSectionStyles = useCallback((sectionId, styleMap = {}) => {
    const colors = getSectionColors(sectionId);
    const styles = {};

    // Default style mappings
    const defaultMap = {
      backgroundColor: 'backgroundColor',
      color: 'textColor',
      borderColor: 'borderColor',
    };

    const mapping = { ...defaultMap, ...styleMap };

    Object.entries(mapping).forEach(([cssProperty, colorKey]) => {
      if (colors[colorKey]) {
        styles[cssProperty] = colors[colorKey];
      }
    });

    return styles;
  }, [getSectionColors]);

  // Check if a section is enabled
  const isSectionEnabled = useCallback((sectionId) => {
    if (!themeColors || !themeColors.sections) return true;

    const section = themeColors.sections.find(s => s.sectionId === sectionId);
    return section ? section.enabled !== false : true;
  }, [themeColors]);

  // Refresh theme colors
  const refreshColors = useCallback(() => {
    fetchThemeColors();
  }, [fetchThemeColors]);

  const value = {
    themeColors,
    loading,
    error,
    getSectionColors,
    getColor,
    getSectionCssVars,
    getSectionStyles,
    isSectionEnabled,
    refreshColors,
  };

  return (
    <ThemeColorsContext.Provider value={value}>
      {children}
    </ThemeColorsContext.Provider>
  );
};

// Higher-order component for wrapping pages with theme colors
export const withThemeColors = (WrappedComponent, pageName) => {
  return function WithThemeColorsWrapper(props) {
    return (
      <ThemeColorsProvider pageName={pageName}>
        <WrappedComponent {...props} />
      </ThemeColorsProvider>
    );
  };
};

export default ThemeColorsContext;
