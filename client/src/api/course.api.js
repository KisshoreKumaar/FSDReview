import api from './client.js';

export const listCourses = (params = {}) => api.get('/courses', { params }).then((r) => r.data.data);
export const getCourse = (id) => api.get(`/courses/${id}`).then((r) => r.data.data.course);
export const createCourse = (payload) => api.post('/courses', payload).then((r) => r.data.data.course);
export const updateCourse = (id, payload) => api.patch(`/courses/${id}`, payload).then((r) => r.data.data.course);
export const updateCutOff = (id, payload) =>
  api.patch(`/courses/${id}/cutoff`, payload).then((r) => r.data.data.course);
export const deactivateCourse = (id) => api.delete(`/courses/${id}`).then((r) => r.data.data.course);
