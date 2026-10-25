
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api",
  timeout: 120000,
});

export const healthAPI = {
  check: () => api.get("/health/"),
};

export const detectionAPI = {
  upload: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/detection/upload/", formData, {
      onUploadProgress,
    });
  },

  getHistory: (params = {}) =>
    api.get("/detection/history/", { params }),

  getUpload: (id) =>
    api.get(`/detection/history/${id}/`),

  getResults: (id, params = {}) =>
    api.get(`/detection/history/${id}/results/`, {
      params,
    }),

  getAlerts: (params = {}) =>
    api.get("/detection/alerts/", { params }),
};

export const analyticsAPI = {
  getDashboard: () =>
    api.get("/analytics/dashboard/"),

  getClassifications: () =>
    api.get("/analytics/classifications/"),

  getModelMetrics: () =>
  api.get("/analytics/model/"),
};

export default api;
