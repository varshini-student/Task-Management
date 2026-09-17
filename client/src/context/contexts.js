import { createContext } from "react";

/**
 * Context objects live in their own module so the provider files export
 * components only (keeps react-refresh and eslint happy).
 */
export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
