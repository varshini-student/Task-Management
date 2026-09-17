import { api } from "./api.js";

export const login = async (credentials) => {
  const { data } = await api.post("/auth/login", credentials);
  return data.user;
};

export const logout = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};

/** Returns the signed-in user or null. Never triggers the session-expired event. */
export const fetchSession = async () => {
  const { data } = await api.get("/auth/session", { skipSessionExpiry: true });
  return data.authenticated ? data.user : null;
};
