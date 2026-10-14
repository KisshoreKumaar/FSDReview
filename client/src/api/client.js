import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({ baseURL, withCredentials: true });

let accessToken = null;
let onAuthLost = () => {};

export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;
export const setAuthLostHandler = (fn) => {
  onAuthLost = fn;
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing = null;

/**
 * One in-flight refresh shared by every caller — queued 401s and the app's
 * own boot check. Without this, concurrent refreshes rotate each other's
 * token and the session dies.
 */
export const refreshSession = async () => {
  refreshing =
    refreshing ||
    api
      .post('/auth/refresh')
      .then((res) => {
        accessToken = res.data.data.accessToken;
        return res.data.data;
      })
      .finally(() => {
        refreshing = null;
      });
  return refreshing;
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const url = config?.url || '';
    const isAuthCall = url.includes('/auth/refresh') || url.includes('/auth/login');

    if (response?.status === 401 && !config?._retried && !isAuthCall) {
      config._retried = true;
      try {
        await refreshSession();
        return api(config);
      } catch {
        accessToken = null;
        onAuthLost();
      }
    }
    return Promise.reject(error);
  },
);

export const apiMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || error?.message || fallback;

export const apiFieldErrors = (error) => error?.response?.data?.errors || [];

export default api;
