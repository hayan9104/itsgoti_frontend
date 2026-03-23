import axios from 'axios';

const API_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-logout for these endpoints (they handle 401 errors themselves)
    const url = error.config?.url || '';
    const skipAutoLogout =
      url.includes('change-password') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register');

    if (error.response?.status === 401 && !skipAutoLogout) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/goti/admin/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.get('/auth/logout'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Users API (Admin)
export const usersAPI = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  create: (data) => api.post('/auth/register', data),
};

// Works API
export const worksAPI = {
  getAll: (params) => api.get('/works', { params }),
  getOne: (id) => api.get(`/works/${id}`),
  create: (data) => api.post('/works', data),
  update: (id, data) => api.put(`/works/${id}`, data),
  delete: (id) => api.delete(`/works/${id}`),
  reorder: (orderedIds) => api.put('/works/reorder', { orderedIds }),
};

// Case Studies API
export const caseStudiesAPI = {
  getAll: (params) => api.get('/case-studies', { params }),
  getOne: (slug) => api.get(`/case-studies/${slug}`),
  create: (data) => api.post('/case-studies', data),
  update: (id, data) => api.put(`/case-studies/${id}`, data),
  delete: (id) => api.delete(`/case-studies/${id}`),
};

// Contacts API
export const contactsAPI = {
  getAll: (params) => api.get('/contacts', { params }),
  getOne: (id) => api.get(`/contacts/${id}`),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
};

// Helper: get themeId from URL if present (for preview mode)
const getThemeIdFromUrl = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('themeId');
  }
  return null;
};

// Pages API (automatically passes themeId from URL for theme preview)
export const pagesAPI = {
  getAll: () => {
    const themeId = getThemeIdFromUrl();
    return api.get('/pages', { params: themeId ? { themeId } : {} });
  },
  getOne: (name) => {
    const themeId = getThemeIdFromUrl();
    return api.get(`/pages/${name}`, { params: themeId ? { themeId } : {} });
  },
  create: (data) => api.post('/pages', data),
  update: (name, data) => api.put(`/pages/${name}`, data),
  delete: (name) => api.delete(`/pages/${name}`),
};

// Themes API
export const themesAPI = {
  getAll: () => api.get('/themes'),
  getOne: (id) => api.get(`/themes/${id}`),
  create: (data) => api.post('/themes', data),
  update: (id, data) => api.put(`/themes/${id}`, data),
  delete: (id) => api.delete(`/themes/${id}`),
  duplicate: (id, data) => api.post(`/themes/${id}/duplicate`, data),
  publish: (id) => api.put(`/themes/${id}/publish`),
  getPage: (themeId, pageName) => api.get(`/themes/${themeId}/pages/${pageName}`),
  updatePage: (themeId, pageName, data) => api.put(`/themes/${themeId}/pages/${pageName}`, data),
  getAllPages: (id) => api.get(`/themes/${id}/all-pages`),
  pushAllPages: (id, data) => api.put(`/themes/${id}/all-pages`, data),
  // Get default landing page for live theme (public)
  getDefaultLanding: () => api.get('/themes/default-landing'),
};

// Upload API
export const uploadAPI = {
  single: (formData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  multiple: (formData) =>
    api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // Alias for uploadImage used in admin forms
  uploadImage: (formData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// WhatsApp Flows API (Flow Builder)
export const whatsappFlowsAPI = {
  getAll: () => api.get('/whatsapp-flows'),
  getOne: (id) => api.get(`/whatsapp-flows/${id}`),
  create: (data) => api.post('/whatsapp-flows', data),
  update: (id, data) => api.put(`/whatsapp-flows/${id}`, data),
  delete: (id) => api.delete(`/whatsapp-flows/${id}`),
  toggle: (id) => api.patch(`/whatsapp-flows/${id}/toggle`),
  duplicate: (id) => api.post(`/whatsapp-flows/${id}/duplicate`),
  getTemplates: () => api.get('/whatsapp-flows/templates'),
  createFromTemplate: (templateId, data) => api.post(`/whatsapp-flows/from-template/${templateId}`, data),
  uploadMedia: (formData) => api.post('/whatsapp-flows/upload-media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Theme Colors API (Color Styling System)
export const themeColorsAPI = {
  // Get all theme color configurations
  getAll: () => api.get('/theme-colors'),
  // Get color schema (list of available color properties)
  getSchema: () => api.get('/theme-colors/schema'),
  // Get theme colors for a specific page
  getByPage: (pageName) => api.get(`/theme-colors/${pageName}`),
  // Create or update theme colors for a page
  upsert: (pageName, data) => api.post(`/theme-colors/${pageName}`, data),
  // Update colors for a specific section
  updateSection: (pageName, sectionId, data) =>
    api.put(`/theme-colors/${pageName}/section/${sectionId}`, data),
  // Update global colors for a page
  updateGlobal: (pageName, data) =>
    api.put(`/theme-colors/${pageName}/global`, data),
  // Reset theme colors to defaults
  reset: (pageName) => api.post(`/theme-colors/${pageName}/reset`),
  // Delete theme colors configuration
  delete: (pageName) => api.delete(`/theme-colors/${pageName}`),
};

export default api;
