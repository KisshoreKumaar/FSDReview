import api, { refreshSession as sharedRefresh } from './client.js';

export const registerUser = (payload) => api.post('/auth/register', payload).then((r) => r.data.data);
export const verifyOtp = (payload) => api.post('/auth/verify-otp', payload).then((r) => r.data.data);
export const resendOtp = (email) => api.post('/auth/resend-otp', { email }).then((r) => r.data.data);
export const loginUser = (payload) => api.post('/auth/login', payload).then((r) => r.data.data);
export const refreshSession = () => sharedRefresh();
export const logoutUser = () => api.post('/auth/logout').then((r) => r.data);
export const fetchMe = () => api.get('/auth/me').then((r) => r.data.data.user);
