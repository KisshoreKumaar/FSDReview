import api from './client.js';

export const listDocuments = (applicationId) =>
  api.get(`/applications/${applicationId}/documents`).then((r) => r.data.data.documents);

export const uploadDocument = (applicationId, { type, file, onProgress }) => {
  const form = new FormData();
  form.append('type', type);
  form.append('file', file);
  return api
    .post(`/applications/${applicationId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / (e.total || 1))),
    })
    .then((r) => r.data.data.document);
};

export const deleteDocument = (id) => api.delete(`/documents/${id}`).then((r) => r.data);

export const verifyDocument = (id, payload) =>
  api.patch(`/documents/${id}/verify`, payload).then((r) => r.data.data.document);
