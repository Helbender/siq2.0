import axios from "axios";

// Use environment variable for API URL, fallback to /api for development proxy
const apiUrl = import.meta.env.VITE_API_URL || "/api";

export const http = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // REQUIRED for refresh cookies
});

// Access token lives only in module memory — never in localStorage.
// XSS cannot exfiltrate a JS variable to another origin.
let _token = null;
export const getToken = () => _token;
export const setToken = (t) => {
  _token = t;
};

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
    const token = getToken();
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

    // Don't try to refresh if there's no access token (user not logged in)
    if (!getToken()) {
      return Promise.reject(error);
    }

    // Don't try to refresh if the failed request WAS a refresh request
    const isRefreshCall =
      originalRequest.url && originalRequest.url.includes("/auth/refresh");
    if (isRefreshCall) {
      setToken(null);
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

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

      setToken(newToken);
      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return http(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      const isAuthError =
        refreshError.response?.status === 401 ||
        refreshError.response?.status === 422;

      if (isAuthError) {
        setToken(null);
        window.dispatchEvent(new Event("auth:logout"));
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const setLoggingOut = (value) => {
  isLoggingOut = value;
  if (value) {
    processQueue(new Error("Logout in progress"), null);
    isRefreshing = false;
    refreshQueue = [];
  }
};
