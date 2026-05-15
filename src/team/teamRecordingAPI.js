import axios from 'axios';

// Authenticated client — reuses the team token interceptor pattern from teamAPI.
const teamRecordingClient = axios.create({
  baseURL: '/api/team/recordings',
});
teamRecordingClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('team_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Public, no-auth client for the /v/:shareId page.
const publicRecordingClient = axios.create({
  baseURL: '/api/public/recording',
});

export const teamRecordingsAPI = {
  // scope: 'mine' | 'team' | 'shared'
  list: (scope = 'mine') => teamRecordingClient.get('/', { params: { scope } }),
  // List recordings linked to a specific task (visible to the requester).
  listByTask: (taskId) => teamRecordingClient.get('/', { params: { taskId } }),
  get: (id) => teamRecordingClient.get(`/${id}`),
  // Create — multipart upload of the recorded blob plus metadata.
  // metadata = { title, captureMode, durationSec, visibility, allowComments, allowDownload, taskId, bubbleSize, bubbleShape }
  create: (blob, metadata, onUploadProgress) => {
    const fd = new FormData();
    // Normalize MIME — MediaRecorder sometimes emits 'video/webm;codecs=vp9,opus' which is fine,
    // but some browsers strip it during FormData encoding. Re-wrap the blob with a clean MIME so
    // the multipart part always carries an explicit Content-Type the server can recognise.
    const rawType = (blob.type || 'video/webm').toLowerCase();
    const isMp4 = rawType.includes('mp4');
    const cleanMime = isMp4 ? 'video/mp4' : 'video/webm';
    const ext = isMp4 ? 'mp4' : 'webm';
    const cleanBlob = new Blob([blob], { type: cleanMime });
    fd.append('video', cleanBlob, `recording.${ext}`);
    Object.entries(metadata || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    return teamRecordingClient.post('/', fd, {
      // Let axios set the multipart boundary itself — explicitly setting Content-Type here strips it.
      onUploadProgress,
    });
  },
  update: (id, patch) => teamRecordingClient.patch(`/${id}`, patch),
  remove: (id) => teamRecordingClient.delete(`/${id}`),
  incrementView: (id) => teamRecordingClient.post(`/${id}/view`),

  // Comments
  listComments: (id) => teamRecordingClient.get(`/${id}/comments`),
  addComment: (id, payload) => teamRecordingClient.post(`/${id}/comments`, payload),
  removeComment: (id, commentId) => teamRecordingClient.delete(`/${id}/comments/${commentId}`),
};

export const publicRecordingAPI = {
  get: (shareId) => publicRecordingClient.get(`/share/${shareId}`),
  incrementView: (shareId) => publicRecordingClient.post(`/share/${shareId}/view`),
  listComments: (shareId) => publicRecordingClient.get(`/share/${shareId}/comments`),
  addComment: (shareId, payload) => publicRecordingClient.post(`/share/${shareId}/comments`, payload),
};
