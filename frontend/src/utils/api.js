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

export default api;
