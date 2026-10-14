import api from './client.js';

export const listNotifications = (params = {}) =>
  api.get('/notifications', { params }).then((r) => r.data.data);
export const markRead = (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data.data);
export const markAllRead = () => api.patch('/notifications/read-all').then((r) => r.data.data);
