import axios from "axios";

export const http = axios.create({
  baseURL: "/api",
  withCredentials: true, // REQUIRED for refresh cookies
});

let isRefreshing = false;
let refreshQueue = [];
let isLoggingOut = false;

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

// REQUEST: attach access token
http.interceptors.request.use((config) => {
  // Do NOT attach access token when calling refresh; it should use the refresh cookie only
  const isRefreshCall = config.url && config.url.includes("/auth/refresh");
  if (!isRefreshCall) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// RESPONSE: handle 401
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh if we're explicitly logging out
    if (isLoggingOut) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If already refreshing, queue request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(http(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const res = await http.post("/auth/refresh");
      const newToken = res.data.access_token;

      localStorage.setItem("token", newToken);
      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return http(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("token");

      // 🔴 HARD LOGOUT EVENT
      window.dispatchEvent(new Event("auth:logout"));

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Export function to set logout flag
export const setLoggingOut = (value) => {
  isLoggingOut = value;
  if (value) {
    // Cancel any queued refresh requests
    processQueue(new Error("Logout in progress"), null);
    isRefreshing = false;
    refreshQueue = [];
  }
};
