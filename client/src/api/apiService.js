/**
 * Centralized API service for frontend network calls.
 * Uses axios for standard API routes and fetch for the AI chat endpoint.
 */
import axios from 'axios';

/**
 * Shared axios instance configured with the API base path and timeout.
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

/**
 * Attach the stored bearer token to every outgoing request.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Normalize responses so callers receive response data directly.
 */
api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data || err)
);

// Auth endpoints --------------------------------------------------------------
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Architecture endpoints ------------------------------------------------------
export const archAPI = {
  list: () => api.get('/architectures'),
  get: (id) => api.get(`/architectures/${id}`),
  create: (data) => api.post('/architectures', data),
  update: (id, data) => api.put(`/architectures/${id}`, data),
  delete: (id) => api.delete(`/architectures/${id}`),
  public: (params) => api.get('/architectures/public', { params }),
  fork: (id) => api.post(`/architectures/${id}/fork`),
};

// Preset endpoints ------------------------------------------------------------
export const presetAPI = {
  list: () => api.get('/presets'),
  get: (id) => api.get(`/presets/${id}`),
};

// Simulation log endpoints ----------------------------------------------------
export const simAPI = {
  saveLog: (data) => api.post('/simulation/log', data),
  getLogs: () => api.get('/simulation/logs'),
};

// AI endpoints ----------------------------------------------------------------
export const aiAPI = {
  analyze: (data) => api.post('/ai/analyze', data),
  explainComponent: (data) => api.post('/ai/explain-component', data),
  generatePreset: (data) => api.post('/ai/generate-preset', data),

  /**
   * Chat endpoint uses fetch so it can support streaming or custom handling.
   * @param {Array} messages
   * @param {string} context
   * @returns {Promise<object>}
   */
  chat: async (messages, context) => {
    const token = localStorage.getItem('token');

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, context }),
    });

    return response.json();
  },
};

// Admin endpoints -------------------------------------------------------------
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getArchitectures: (params) => api.get('/admin/architectures', { params }),
  updateArchVisibility: (id, v) => api.patch(`/admin/architectures/${id}/visibility`, { isPublic: v }),
  deleteArchitecture: (id) => api.delete(`/admin/architectures/${id}`),
  getPresets: () => api.get('/admin/presets'),
  deletePreset: (id) => api.delete(`/admin/presets/${id}`),
  makeAdmin: (email, secret) => api.post('/admin/make-admin', { email, secret }),
};

export default api;