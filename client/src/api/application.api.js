import api from './client.js';

export const getMyApplication = () => api.get('/applications/mine').then((r) => r.data.data);
export const getCourseOptions = () =>
  api.get('/applications/course-options').then((r) => r.data.data.courses);
export const createApplication = (payload = {}) =>
  api.post('/applications', payload).then((r) => r.data.data.application);
export const saveApplication = (id, payload) =>
  api.patch(`/applications/${id}`, payload).then((r) => r.data.data);
export const submitApplication = (id) =>
  api.post(`/applications/${id}/submit`).then((r) => r.data.data.application);
export const withdrawApplication = (id, remarks) =>
  api.post(`/applications/${id}/withdraw`, { remarks }).then((r) => r.data.data.application);
export const getApplication = (id) => api.get(`/applications/${id}`).then((r) => r.data.data);

export const listApplications = (params = {}) =>
  api.get('/applications', { params }).then((r) => r.data.data);
export const changeStatus = (id, payload) =>
  api.patch(`/applications/${id}/status`, payload).then((r) => r.data.data.application);
export const assignOfficer = (id, officerId) =>
  api.patch(`/applications/${id}/assign`, { officerId }).then((r) => r.data.data.application);
