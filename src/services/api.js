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
  // Upload any file (video, image, document)
  uploadFile: (formData) =>
    api.post('/upload/file', formData, {
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

// Client Logos API (Centralized Client Logos)
export const clientLogosAPI = {
  getAll: (params) => api.get('/client-logos', { params }),
  getOne: (id) => api.get(`/client-logos/${id}`),
  create: (data) => api.post('/client-logos', data),
  update: (id, data) => api.put(`/client-logos/${id}`, data),
  delete: (id) => api.delete(`/client-logos/${id}`),
  reorder: (orderedIds) => api.put('/client-logos/reorder', { orderedIds }),
  bulkAssign: (logoIds, pages, action) => api.put('/client-logos/bulk-assign', { logoIds, pages, action }),
  // Get logos for a specific page (public)
  getByPage: (page) => api.get('/client-logos', { params: { page, active: true } }),
};

// Reviews API (Centralized Testimonials/Reviews)
export const reviewsAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  getOne: (id) => api.get(`/reviews/${id}`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  reorder: (orderedIds) => api.put('/reviews/reorder', { orderedIds }),
  // Get reviews for a specific page (public)
  getByPage: (page) => api.get('/reviews', { params: { page, active: true } }),
  // Settings (section title, heading visibility)
  getSettings: () => api.get('/reviews/settings'),
  updateSettings: (data) => api.put('/reviews/settings', data),
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

// ============================================
// WORKSPACE APIs (Separate Project Management System)
// ============================================

// Create workspace axios instance with separate token
const workspaceApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add workspace token to requests
workspaceApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('workspace_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle workspace response errors
workspaceApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const skipAutoLogout = url.includes('/workspace/auth/login');

    if (error.response?.status === 401 && !skipAutoLogout) {
      localStorage.removeItem('workspace_token');
      // Redirect to the appropriate login page based on current location
      if (window.location.pathname.startsWith('/plutiocopy')) {
        window.location.href = '/plutiocopy/login';
      } else {
        window.location.href = '/workspace/login';
      }
    }
    return Promise.reject(error);
  }
);

// Workspace Auth API
export const workspaceAuthAPI = {
  login: (data) => workspaceApi.post('/workspace/auth/login', data),
  register: (data) => workspaceApi.post('/workspace/auth/register', data),
  getMe: () => workspaceApi.get('/workspace/auth/me'),
  changePassword: (data) => workspaceApi.put('/workspace/auth/change-password', data),
  linkAccount: (data) => workspaceApi.post('/workspace/auth/link-account', data),
  switchAccount: (id) => workspaceApi.post(`/workspace/auth/switch-account/${id}`),
};

// Workspace Users API (Admin Management)
export const workspaceUsersAPI = {
  getAll: () => workspaceApi.get('/workspace/auth/users'),
  getOne: (id) => workspaceApi.get(`/workspace/auth/users/${id}`),
  create: (data) => workspaceApi.post('/workspace/auth/register', data),
  update: (id, data) => workspaceApi.put(`/workspace/auth/users/${id}`, data),
  delete: (id) => workspaceApi.delete(`/workspace/auth/users/${id}`),
  resetPassword: (id, data) => workspaceApi.put(`/workspace/auth/users/${id}/reset-password`, data),
};

// Workspace Boards API
export const workspaceBoardsAPI = {
  getAll: () => workspaceApi.get('/workspace/boards'),
  getOne: (id) => workspaceApi.get(`/workspace/boards/${id}`),
  create: (data) => workspaceApi.post('/workspace/boards', data),
  update: (id, data) => workspaceApi.put(`/workspace/boards/${id}`, data),
  delete: (id) => workspaceApi.delete(`/workspace/boards/${id}`),
  reorder: (orderedIds) => workspaceApi.put('/workspace/boards/reorder', { orderedIds }),
  addMember: (boardId, data) => workspaceApi.post(`/workspace/boards/${boardId}/members`, data),
  removeMember: (boardId, userId) => workspaceApi.delete(`/workspace/boards/${boardId}/members/${userId}`),
  addDocument: (boardId, data) => workspaceApi.post(`/workspace/boards/${boardId}/documents`, data),
  deleteDocument: (boardId, docId) => workspaceApi.delete(`/workspace/boards/${boardId}/documents/${docId}`),
  // Board settings
  getSettings: (boardId) => workspaceApi.get(`/workspace/boards/${boardId}/settings`),
  updateSettings: (boardId, data) => workspaceApi.put(`/workspace/boards/${boardId}/settings`, data),
  addSettingItem: (boardId, settingType, data) => workspaceApi.post(`/workspace/boards/${boardId}/settings/${settingType}`, data),
  updateSettingItem: (boardId, settingType, itemId, data) => workspaceApi.put(`/workspace/boards/${boardId}/settings/${settingType}/${itemId}`, data),
  deleteSettingItem: (boardId, settingType, itemId) => workspaceApi.delete(`/workspace/boards/${boardId}/settings/${settingType}/${itemId}`),
};

// Workspace Sidebar Items API
export const workspaceSidebarAPI = {
  getMyAccess: () => workspaceApi.get('/workspace/sidebar/my-access'),
  getByBoard: (boardId) => workspaceApi.get(`/workspace/sidebar/board/${boardId}`),
  create: (boardId, data) => workspaceApi.post(`/workspace/sidebar/board/${boardId}`, data),
  update: (id, data) => workspaceApi.put(`/workspace/sidebar/${id}`, data),
  delete: (id) => workspaceApi.delete(`/workspace/sidebar/${id}`),
  // Sharing
  getSharingInfo: (id) => workspaceApi.get(`/workspace/sidebar/${id}/sharing`),
  toggleVisibility: (id) => workspaceApi.put(`/workspace/sidebar/${id}/visibility`),
  addMember: (id, userId) => workspaceApi.post(`/workspace/sidebar/${id}/members`, { userId }),
  removeMember: (id, userId) => workspaceApi.delete(`/workspace/sidebar/${id}/members/${userId}`),
};

// Workspace Tasks API
export const workspaceTasksAPI = {
  // Get tasks for a board
  getByBoard: (boardId, params) => workspaceApi.get(`/workspace/tasks/board/${boardId}`, { params }),
  // Get all tasks (super admin)
  getAll: (params) => workspaceApi.get('/workspace/tasks/all', { params }),
  // Get my tasks
  getMyTasks: (params) => workspaceApi.get('/workspace/tasks/my-tasks', { params }),
  // Single task
  getOne: (id) => workspaceApi.get(`/workspace/tasks/${id}`),
  create: (boardId, data) => workspaceApi.post(`/workspace/tasks/board/${boardId}`, data),
  update: (id, data) => workspaceApi.put(`/workspace/tasks/${id}`, data),
  delete: (id) => workspaceApi.delete(`/workspace/tasks/${id}`),
  // Status & reorder (drag & drop)
  updateStatus: (id, data) => workspaceApi.put(`/workspace/tasks/${id}/status`, data),
  reorder: (boardId, tasks) => workspaceApi.put(`/workspace/tasks/board/${boardId}/reorder`, { tasks }),
  // Logs & comments
  getLogs: (id) => workspaceApi.get(`/workspace/tasks/${id}/logs`),
  getComments: (id) => workspaceApi.get(`/workspace/tasks/${id}/comments`),
  addComment: (id, data) => workspaceApi.post(`/workspace/tasks/${id}/comments`, data),
  // Subtasks
  addSubtask: (id, data) => workspaceApi.post(`/workspace/tasks/${id}/subtasks`, data),
  toggleSubtask: (taskId, subtaskId) => workspaceApi.put(`/workspace/tasks/${taskId}/subtasks/${subtaskId}`),
  deleteSubtask: (taskId, subtaskId) => workspaceApi.delete(`/workspace/tasks/${taskId}/subtasks/${subtaskId}`),
  // Task documents/attachments
  addDocument: (taskId, data) => workspaceApi.post(`/workspace/tasks/${taskId}/documents`, data),
  deleteDocument: (taskId, docId) => workspaceApi.delete(`/workspace/tasks/${taskId}/documents/${docId}`),
  // Notes (embedded in task - things to keep in mind)
  addNote: (taskId, data) => workspaceApi.post(`/workspace/tasks/${taskId}/notes`, data),
  updateNote: (taskId, noteId, data) => workspaceApi.put(`/workspace/tasks/${taskId}/notes/${noteId}`, data),
  deleteNote: (taskId, noteId) => workspaceApi.delete(`/workspace/tasks/${taskId}/notes/${noteId}`),
  getBoardNotes: (boardId) => workspaceApi.get(`/workspace/tasks/board/${boardId}/notes`),
};

// Workspace Upload API
export const workspaceUploadAPI = {
  uploadFile: (formData) =>
    workspaceApi.post('/workspace/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Workspace Messages API (Inbox/Chat)
export const workspaceMessagesAPI = {
  getConversations: () => workspaceApi.get('/workspace/messages/conversations'),
  getMessages: (conversationId, params) => workspaceApi.get(`/workspace/messages/${conversationId}`, { params }),
  sendMessage: (data) => workspaceApi.post('/workspace/messages', data),
  markAsRead: (id) => workspaceApi.put(`/workspace/messages/${id}/read`),
  markConversationAsRead: (conversationId) => workspaceApi.put(`/workspace/messages/conversations/${conversationId}/read`),
  deleteMessage: (id) => workspaceApi.delete(`/workspace/messages/${id}`),
  getUnreadCount: () => workspaceApi.get('/workspace/messages/unread-count'),
  getChatUsers: () => workspaceApi.get('/workspace/messages/users'),
};

// Workspace Scheduled Meetings API (Recall.ai Integration)
export const scheduledMeetingsAPI = {
  // Get all scheduled meetings
  getAll: (params) => workspaceApi.get('/workspace/scheduled-meetings', { params }),
  // Get single meeting
  getOne: (id) => workspaceApi.get(`/workspace/scheduled-meetings/${id}`),
  // Create scheduled meeting
  create: (data) => workspaceApi.post('/workspace/scheduled-meetings', data),
  // Update meeting
  update: (id, data) => workspaceApi.put(`/workspace/scheduled-meetings/${id}`, data),
  // Delete meeting
  delete: (id) => workspaceApi.delete(`/workspace/scheduled-meetings/${id}`),
  // Get meeting status from Recall.ai
  getStatus: (id) => workspaceApi.get(`/workspace/scheduled-meetings/${id}/status`),
  // Process with AI
  process: (id) => workspaceApi.post(`/workspace/scheduled-meetings/${id}/process`),
  // Toggle action item
  toggleActionItem: (id, itemIndex) => workspaceApi.put(`/workspace/scheduled-meetings/${id}/action-items/${itemIndex}`),
  // Manual sync from Recall.ai (fetch recording, transcript, etc.)
  sync: (id) => workspaceApi.post(`/workspace/scheduled-meetings/${id}/sync`),
  // Sync all completed recordings to Meetings tab
  syncAll: (board) => workspaceApi.post(`/workspace/scheduled-meetings/sync-all${board ? `?board=${board}` : ''}`),
};

// Workspace Meetings API (Meeting Notes with AI Processing - Manual Upload)
export const workspaceMeetingsAPI = {
  // Get all meetings
  getAll: (params) => workspaceApi.get('/workspace/meetings', { params }),
  // Get single meeting
  getOne: (id) => workspaceApi.get(`/workspace/meetings/${id}`),
  // Create meeting (with optional recording upload and progress tracking)
  create: (formData, onProgress) => workspaceApi.post('/workspace/meetings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  }),
  // Update meeting
  update: (id, data) => workspaceApi.put(`/workspace/meetings/${id}`, data),
  // Delete meeting
  delete: (id) => workspaceApi.delete(`/workspace/meetings/${id}`),
  // Upload recording to existing meeting
  uploadRecording: (id, formData) => workspaceApi.post(`/workspace/meetings/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  // Process recording with AI
  processRecording: (id) => workspaceApi.post(`/workspace/meetings/${id}/process`),
  // Toggle action item completion
  toggleActionItem: (id, itemIndex) => workspaceApi.put(`/workspace/meetings/${id}/action-items/${itemIndex}`),
  // Export meeting as PDF
  exportPDF: (id) => workspaceApi.get(`/workspace/meetings/${id}/export-pdf`, { responseType: 'blob' }),
};

// Plutio Copy Boards API
export const plutioBoardsAPI = {
  getAll: () => workspaceApi.get('/plutio/boards'),
  getProjects: () => workspaceApi.get('/plutio/boards/projects'),
  getSubBoards: (projectId) => workspaceApi.get(`/plutio/boards/project/${projectId}`),
  create: (data) => workspaceApi.post('/plutio/boards', data),
  update: (id, data) => workspaceApi.put(`/plutio/boards/${id}`, data),
  delete: (id) => workspaceApi.delete(`/plutio/boards/${id}`),
};

// Plutio Copy Tasks API
export const plutioTasksAPI = {
  getAll: () => workspaceApi.get('/plutio/tasks/all'),
  getByBoard: (boardId) => workspaceApi.get(`/plutio/tasks/board/${boardId}`),
  create: (boardId, data) => workspaceApi.post(`/plutio/tasks/board/${boardId}`, data),
  update: (id, data) => workspaceApi.put(`/plutio/tasks/${id}`, data),
  delete: (id) => workspaceApi.delete(`/plutio/tasks/${id}`),
};

export const plutioTaskGroupsAPI = {
  getByBoard: (boardId) => workspaceApi.get(`/plutio/task-groups/board/${boardId}`),
  create: (boardId, data) => workspaceApi.post(`/plutio/task-groups/board/${boardId}`, data),
  update: (id, data) => workspaceApi.put(`/plutio/task-groups/${id}`, data),
  delete: (id) => workspaceApi.delete(`/plutio/task-groups/${id}`),
};

export const plutioContactsAPI = {
  getAll: () => workspaceApi.get('/plutio/contacts'),
  create: (data) => workspaceApi.post('/plutio/contacts', data),
  update: (id, data) => workspaceApi.put(`/plutio/contacts/${id}`, data),
  delete: (id) => workspaceApi.delete(`/plutio/contacts/${id}`),
};

export const plutioCommentsAPI = {
  getByTask: (taskId) => workspaceApi.get(`/plutio/comments/task/${taskId}`),
  create: (taskId, formData) => workspaceApi.post(`/plutio/comments/task/${taskId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => workspaceApi.delete(`/plutio/comments/${id}`),
};

export const plutioTimeEntriesAPI = {
  getByBoard: (boardId) => workspaceApi.get(`/plutio/time-entries/board/${boardId}`),
  create:     (boardId, data) => workspaceApi.post(`/plutio/time-entries/board/${boardId}`, data),
  update:     (id, data) => workspaceApi.put(`/plutio/time-entries/${id}`, data),
  delete:     (id) => workspaceApi.delete(`/plutio/time-entries/${id}`),
};

export default api;
