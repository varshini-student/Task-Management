import axios from "axios";

/**
 * Single Axios instance for the whole app.
 * withCredentials sends the Better Auth session cookie on every request.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/** Emitted when the API reports an expired or missing session. */
export const SESSION_EXPIRED_EVENT = "tms:session-expired";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;

    if (status === 401 && !error.config?.skipSessionExpiry) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }

    // Normalise every failure into a predictable shape for the UI.
    error.apiMessage =
      payload?.message ||
      (error.code === "ERR_NETWORK"
        ? "Cannot reach the server. Check that the API is running."
        : "Something went wrong. Please try again.");
    error.fieldErrors = payload?.errors || null;
    error.status = status ?? 0;

    return Promise.reject(error);
  }
);

/** Extracts a user-facing message from any thrown error. */
export const getErrorMessage = (error) =>
  error?.apiMessage || error?.message || "Something went wrong. Please try again.";

export const getFieldErrors = (error) => error?.fieldErrors || {};
