import { api } from "./api.js";

export const authService = {
  register: (email, password) =>
    api.post("/auth/register", { email, password }),

  login: (email, password) => api.post("/auth/login", { email, password }),

  logout: () => api.post("/auth/logout", {}),

  refresh: () => api.post("/auth/refresh", {}),
};
