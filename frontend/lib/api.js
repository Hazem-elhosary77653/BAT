import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds default (increased from 10s for AI operations)
});

// Add token to requests
api.interceptors.request.use((config) => {
  // Fix for root-relative URLs when baseURL has a path suffix (like /api)
  if (config.url && config.url.startsWith('/')) {
    config.url = config.url.substring(1);
  } else if (!config.url) {
    // If url is empty (e.g. for listing base resource), keep it empty
    config.url = '';
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token refresh logic on 401
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized and it's not the refresh or login endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh') && !originalRequest.url.includes('/auth/login')) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Use a clean axios instance for the refresh call to avoid interceptor deadlock
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        const newToken = refreshResponse.data.token;

        if (newToken && typeof window !== 'undefined') {
          localStorage.setItem('token', newToken);
        }

        processQueue(null, newToken);

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);

        // If refresh fails with 401 or session timeout, force logout
        console.log('[API] Authentication failure, forcing logout');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          // Optional: clear other state if needed
          window.location.href = '/login';
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle case where it's already a retry or refresh endpoint failed
    if (error.response?.status === 401) {
      console.log('[API] 401 Fallthrough - Redirection');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
