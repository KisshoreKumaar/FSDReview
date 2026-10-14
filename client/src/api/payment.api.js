import api from './client.js';

export const getMyPayment = () => api.get('/payments/mine').then((r) => r.data.data);
export const createOrder = () => api.post('/payments/order').then((r) => r.data.data);
export const confirmPayment = (payload) => api.post('/payments/confirm', payload).then((r) => r.data.data);
