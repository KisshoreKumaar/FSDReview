import api from './client.js';

export const getStats = () => api.get('/admin/stats').then((r) => r.data.data);
export const listOfficers = () => api.get('/admin/officers').then((r) => r.data.data.officers);
export const createOfficer = (payload) => api.post('/admin/officers', payload).then((r) => r.data.data);
export const updateOfficer = (id, payload) =>
  api.patch(`/admin/officers/${id}`, payload).then((r) => r.data.data.officer);
