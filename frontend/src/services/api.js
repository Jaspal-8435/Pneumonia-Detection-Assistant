import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://pneumonia-detection-diagnosis-assistant.onrender.com/api",
});

function readStoredToken() {
  try {
    const raw = localStorage.getItem("pneumonia-auth");
    return raw ? JSON.parse(raw)?.state?.token : null;
  } catch (error) {
    return null;
  }
}

// Every protected backend route expects Authorization: Bearer <token>.
api.interceptors.request.use((config) => {
  const token = readStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
