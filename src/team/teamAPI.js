import axios from 'axios';

const teamAPI = axios.create({
  baseURL: '/api/team',
  headers: { 'Content-Type': 'application/json' },
});

teamAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('team_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

teamAPI.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      const path = window.location.pathname;
      if (path.startsWith('/team') && path !== '/team') {
        localStorage.removeItem('team_token');
        window.location.href = '/team';
      }
    }
    return Promise.reject(err);
  }
);

export const teamAuthAPI = {
  login: (email, password) => teamAPI.post('/auth/login', { email, password }),
  me: () => teamAPI.get('/auth/me'),
  updateName: (name) => teamAPI.patch('/auth/me', { name }),
  changePassword: (currentPassword, newPassword) =>
    teamAPI.post('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: () => teamAPI.post('/auth/forgot-password'),
};

export const teamEmployeesAPI = {
  list: () => teamAPI.get('/employees'),
  create: (payload) => teamAPI.post('/employees', payload),
  update: (id, payload) => teamAPI.patch(`/employees/${id}`, payload),
  setPassword: (id, password) => teamAPI.post(`/employees/${id}/set-password`, { password }),
  resetPassword: (id) => teamAPI.post(`/employees/${id}/reset-password`),
  remove: (id) => teamAPI.delete(`/employees/${id}`),
};

export const teamSessionsAPI = {
  todayMe: () => teamAPI.get('/sessions/today/me'),
  startDay: (payload = {}) => teamAPI.post('/sessions/start-day', payload),
  startBreak: () => teamAPI.post('/sessions/start-break'),
  endBreak: () => teamAPI.post('/sessions/end-break'),
  startAfk: (reason) => teamAPI.post('/sessions/start-afk', { reason }),
  endAfk: () => teamAPI.post('/sessions/end-afk'),
  endDay: () => teamAPI.post('/sessions/end-day'),
  setActiveTask: (activeTask, activeTaskId) => teamAPI.patch('/sessions/today/me/active-task', { activeTask, activeTaskId }),
  todayAll: () => teamAPI.get('/sessions/today/all'),
  historyMe: (days = 30) => teamAPI.get(`/sessions/history/me?days=${days}`),
  historyOf: (employeeId, days = 30) => teamAPI.get(`/sessions/history/${employeeId}?days=${days}`),
};

export const teamTasksAPI = {
  list: (params = {}) => teamAPI.get('/tasks', { params }),
  get: (id) => teamAPI.get(`/tasks/${id}`),
  create: (payload) => teamAPI.post('/tasks', payload),
  update: (id, payload) => teamAPI.patch(`/tasks/${id}`, payload),
  archive: (id) => teamAPI.delete(`/tasks/${id}`),
  restore: (id) => teamAPI.post(`/tasks/${id}/restore`),
  removePermanent: (id) => teamAPI.delete(`/tasks/${id}/permanent`),
  // Legacy alias used in a few places; behaves the same as archive now.
  remove: (id) => teamAPI.delete(`/tasks/${id}`),
  uploadFiles: (files) => {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    return teamAPI.post('/tasks/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const teamLeavesAPI = {
  list: (params = {}) => teamAPI.get('/leaves', { params }),
  get: (id) => teamAPI.get(`/leaves/detail/${id}`),
  apply: (payload) => teamAPI.post('/leaves', payload),
  decide: (id, decision, note) => teamAPI.post(`/leaves/${id}/decision`, { decision, note }),
  cancel: (id) => teamAPI.delete(`/leaves/${id}`),
  myBalance: () => teamAPI.get('/leaves/balance/me'),
  employeeBalance: (employeeId) => teamAPI.get(`/leaves/balance/${employeeId}`),
  allBalances: () => teamAPI.get('/leaves/balances/all'),
  uploadFiles: (files) => {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    return teamAPI.post('/leaves/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  addAttachments: (id, attachments) => teamAPI.post(`/leaves/${id}/attachments`, { attachments }),
};

export const teamSettingsAPI = {
  get: () => teamAPI.get('/settings'),
  update: (payload) => teamAPI.patch('/settings', payload),
};

export const teamNotificationsAPI = {
  list: (limit = 20) => teamAPI.get(`/notifications?limit=${limit}`),
  markSeen: (id) => teamAPI.post(`/notifications/${id}/seen`),
  markAllSeen: () => teamAPI.post('/notifications/seen-all'),
};

export const teamReportsAPI = {
  overview: (period = 'week', date) => {
    const q = new URLSearchParams({ period });
    if (date) q.set('date', date);
    return teamAPI.get(`/reports/overview?${q.toString()}`);
  },
  employee: (employeeId, period = 'month', date) => {
    const q = new URLSearchParams({ period });
    if (date) q.set('date', date);
    return teamAPI.get(`/reports/employee/${employeeId}?${q.toString()}`);
  },
  myWeekly: () => teamAPI.get('/reports/me/weekly'),
};

export default teamAPI;
