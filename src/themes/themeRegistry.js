// Auto-discover all theme folders at build time via Vite's import.meta.glob
const themeModules = import.meta.glob('./*/index.js', { eager: true });

// Build registry: { "default": { Home, Landing, ... }, "animated": { Home, Landing, ... } }
const themeRegistry = {};

for (const [path, module] of Object.entries(themeModules)) {
  // path is like "./default/index.js" or "./animated/index.js"
  const themeCode = path.split('/')[1];
  themeRegistry[themeCode] = module;
}

/**
 * Get a component from a theme, with fallback to 'default'.
 * @param {string} themeCode - e.g., "animated"
 * @param {string} componentName - e.g., "Home", "Landing"
 * @returns {React.Component}
 */
export function getThemeComponent(themeCode, componentName) {
  const theme = themeRegistry[themeCode] || themeRegistry['default'];
  return theme?.[componentName] || themeRegistry['default']?.[componentName] || null;
}

export function getAvailableThemeCodes() {
  return Object.keys(themeRegistry);
}

export default themeRegistry;
