import axios from "axios";
import { API_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("clutchq_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getErrorMessage = (error) => error?.response?.data?.message || error?.message || "Something went wrong";

export default api;
