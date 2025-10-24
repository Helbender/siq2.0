import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;
export const api = axios.create({
  baseURL,
  // sem credentials
});

export const apiAuth = axios.create({
  baseURL,
  withCredentials: true,
});

// Interceptor que corre antes de cada pedido
apiAuth.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token"); // ou sessionStorage, ou de onde preferires
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle 401 errors globally and token refresh
apiAuth.interceptors.response.use(
  (response) => {
    // Check if response contains a new access token
    if (response.data && response.data.access_token) {
      // Update the token in sessionStorage
      sessionStorage.setItem("token", response.data.access_token);
      console.log("Token refreshed automatically");
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      sessionStorage.removeItem("token");
      // Force page reload to trigger re-authentication check
      window.location.href = "/#/login";
    }
    return Promise.reject(error);
  }
);

export default api;
