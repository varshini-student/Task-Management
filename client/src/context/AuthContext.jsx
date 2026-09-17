import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./contexts.js";
import { SESSION_EXPIRED_EVENT } from "../services/api.js";
import * as authService from "../services/authService.js";

/**
 * Holds the authenticated user for the whole app.
 * The session itself lives in a Better Auth httpOnly cookie - the browser
 * never stores the user in localStorage, so it cannot be tampered with.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initialising, setInitialising] = useState(true);

  // Restore the session on first load / hard refresh.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await authService.fetchSession();
        if (active) setUser(session);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setInitialising(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Any 401 from the API clears the local user immediately.
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, []);

  const login = useCallback(async (credentials) => {
    const signedIn = await authService.login(credentials);
    setUser(signedIn);
    return signedIn;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      initialising,
      login,
      logout,
    }),
    [user, initialising, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
