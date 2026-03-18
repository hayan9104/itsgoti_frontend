import { useState, useEffect, useCallback } from 'react';
import { themeColorsAPI } from '../services/api';

/**
 * Hook to fetch and use theme colors for a specific page
 * @param {string} pageName - The page name (e.g., 'landing-page-3')
 * @returns {object} - Theme colors data and helper functions
 */
export const useThemeColors = (pageName) => {
  const [themeColors, setThemeColors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch theme colors - deferred to not block initial render
  useEffect(() => {
    if (!pageName) {
      setLoading(false);
      return;
    }

    const fetchColors = async () => {
      try {
        const response = await themeColorsAPI.getByPage(pageName);
        setThemeColors(response.data.data);
        setError(null);
      } catch (err) {
        // Silent fail - use defaults
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Defer API call - render page first
    const timer = setTimeout(fetchColors, 150);
    return () => clearTimeout(timer);
  }, [pageName]);

  /**
   * Get colors for a specific section
   * @param {string} sectionId - The section ID
   * @returns {object} - Color values for the section
   */
  const getSectionColors = useCallback((sectionId) => {
    if (!themeColors?.sections) return {};

    const section = themeColors.sections.find(s => s.sectionId === sectionId);
    if (!section?.enabled) return {};

    // Merge global colors with section-specific colors
    return {
      ...themeColors.globalColors,
      ...section.colors,
    };
  }, [themeColors]);

  /**
   * Get a specific color value with fallback
   * @param {string} sectionId - The section ID
   * @param {string} colorKey - The color property key
   * @param {string} fallback - Fallback color if not found
   * @returns {string} - The color value
   */
  const getColor = useCallback((sectionId, colorKey, fallback = '') => {
    const colors = getSectionColors(sectionId);
    return colors[colorKey] || fallback;
  }, [getSectionColors]);

  /**
   * Generate CSS variables object for a section
   * @param {string} sectionId - The section ID
   * @returns {object} - CSS variables object (for style prop)
   */
  const getCssVars = useCallback((sectionId) => {
    const colors = getSectionColors(sectionId);
    const cssVars = {};

    Object.entries(colors).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        cssVars[cssVarName] = value;
      }
    });

    return cssVars;
  }, [getSectionColors]);

  /**
   * Apply colors to a style object
   * @param {string} sectionId - The section ID
   * @param {object} baseStyles - Base styles object
   * @param {object} colorMap - Map of style properties to color keys
   * @returns {object} - Merged styles with colors
   */
  const applyColors = useCallback((sectionId, baseStyles = {}, colorMap = {}) => {
    const colors = getSectionColors(sectionId);
    const appliedStyles = { ...baseStyles };

    // Default color mappings
    const defaultMap = {
      backgroundColor: 'backgroundColor',
      color: 'textColor',
      borderColor: 'borderColor',
    };

    const mapping = { ...defaultMap, ...colorMap };

    Object.entries(mapping).forEach(([styleKey, colorKey]) => {
      if (colors[colorKey]) {
        appliedStyles[styleKey] = colors[colorKey];
      }
    });

    return appliedStyles;
  }, [getSectionColors]);

  return {
    themeColors,
    loading,
    error,
    getSectionColors,
    getColor,
    getCssVars,
    applyColors,
  };
};

export default useThemeColors;
