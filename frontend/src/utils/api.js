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
export default api;
