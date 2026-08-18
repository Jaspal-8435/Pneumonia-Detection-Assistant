import { create } from "zustand";

import api from "../services/api";
import { getApiErrorMessage } from "../utils/apiError";

export const useScanStore = create((set) => ({
  currentScan: null,
  scans: [],
  stats: null,
  isUploading: false,
  isLoading: false,
  error: null,

  uploadScan: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    set({ isUploading: true, error: null });
    try {
      const { data } = await api.post("/scans/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set((state) => ({
        currentScan: data.scan,
        scans: [data.scan, ...state.scans.filter((scan) => scan.id !== data.scan.id)],
        isUploading: false,
      }));
      return data.scan;
    } catch (error) {
      const message = getApiErrorMessage(error, "Upload failed.");
      set({ error: message, isUploading: false });
      throw new Error(message);
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get("/scans/history");
      set({ scans: data.scans, isLoading: false });
      return data.scans;
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not load history.");
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  fetchScanById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/scans/${id}`);
      set({ currentScan: data.scan, isLoading: false });
      return data.scan;
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not load scan.");
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  updateDoctorNote: async (id, doctorNote) => {
    const { data } = await api.patch(`/scans/${id}/note`, { doctorNote });
    set({ currentScan: data.scan });
    return data.scan;
  },

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get("/admin/stats");
      set({ stats: data, isLoading: false });
      return data;
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not load stats.");
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  clearCurrentScan: () => {
    set({ currentScan: null, error: null });
  },
}));

