import { create } from "zustand";
import { persist } from "zustand/middleware";

import api from "../services/api";
import { getApiErrorMessage } from "../utils/apiError";

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/auth/login", payload);
          set({ token: data.token, user: data.user, isLoading: false });
          return data.user;
        } catch (error) {
          const message = getApiErrorMessage(error, "Login failed.");
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      signup: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/auth/signup", payload);
          set({ token: data.token, user: data.user, isLoading: false });
          return data.user;
        } catch (error) {
          const message = getApiErrorMessage(error, "Signup failed.");
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      refreshProfile: async () => {
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data.user });
          return data.user;
        } catch (error) {
          set({ token: null, user: null });
          throw error;
        }
      },

      logout: () => {
        set({ token: null, user: null, error: null });
      },
    }),
    {
      name: "pneumonia-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

