import api from './client.js';

export const listMeritLists = () => api.get('/merit').then((r) => r.data.data.meritLists);
export const generateMeritList = (courseId) =>
  api.post('/merit/generate', { courseId }).then((r) => r.data.data);
export const previewMeritList = (id) => api.get(`/merit/preview/${id}`).then((r) => r.data.data.meritList);
export const publishMeritList = (id) => api.post(`/merit/publish/${id}`).then((r) => r.data.data.meritList);
export const publishedMeritLists = (params = {}) =>
  api.get('/merit/published', { params }).then((r) => r.data.data.meritLists);
