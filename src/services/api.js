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
      window.location.href = '/admin/login';
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

// Pages API
export const pagesAPI = {
  getAll: () => api.get('/pages'),
  getOne: (name) => api.get(`/pages/${name}`),
  create: (data) => api.post('/pages', data),
  update: (name, data) => api.put(`/pages/${name}`, data),
  delete: (name) => api.delete(`/pages/${name}`),
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

export default api;
