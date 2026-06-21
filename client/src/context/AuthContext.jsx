import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api, { getErrorMessage } from "../services/api";

const AuthContext = createContext(null);

const readStoredJson = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const clearStoredSession = () => {
  localStorage.removeItem("clutchq_token");
  localStorage.removeItem("clutchq_user");
  localStorage.removeItem("clutchq_profile");
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("clutchq_token"));
  const [user, setUser] = useState(() => (localStorage.getItem("clutchq_token") ? readStoredJson("clutchq_user") : null));
  const [profile, setProfile] = useState(() => (localStorage.getItem("clutchq_token") ? readStoredJson("clutchq_profile") : null));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("clutchq_token")));
  const mountedRef = useRef(true);

  const persistSession = useCallback((nextUser, nextProfile) => {
    if (nextUser) localStorage.setItem("clutchq_user", JSON.stringify(nextUser));
    else localStorage.removeItem("clutchq_user");

    if (nextProfile) localStorage.setItem("clutchq_profile", JSON.stringify(nextProfile));
    else localStorage.removeItem("clutchq_profile");
  }, []);

  const applySession = useCallback((payload) => {
    if (payload?.token) {
      localStorage.setItem("clutchq_token", payload.token);
      setToken(payload.token);
    }
    setUser(payload?.user || null);
    setProfile(payload?.profile || null);
    persistSession(payload?.user, payload?.profile);
  }, [persistSession]);

  const resetSession = useCallback(() => {
    clearStoredSession();
    setToken(null);
    setUser(null);
    setProfile(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem("clutchq_token")) {
      if (mountedRef.current) {
        resetSession();
        setLoading(false);
      }
      return null;
    }

    if (mountedRef.current) setLoading(true);
    try {
      const response = await Promise.race([
        api.get("/auth/me"),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error("Auth refresh timed out")), 8000))
      ]);
      if (!mountedRef.current) return response.data.data;
      setUser(response.data.data.user);
      setProfile(response.data.data.profile);
      persistSession(response.data.data.user, response.data.data.profile);
      return response.data.data;
    } catch (error) {
      if (mountedRef.current && (error?.response?.status === 401 || error?.response?.status === 403)) {
        resetSession();
      }
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [persistSession, resetSession]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    applySession(response.data.data);
    return response.data.data;
  }, [applySession]);

  const register = useCallback(async (payload) => {
    const response = await api.post("/auth/register", payload);
    applySession(response.data.data);
    return response.data.data;
  }, [applySession]);

  const demoLogin = useCallback(async () => {
    const response = await api.post("/auth/demo");
    applySession(response.data.data);
    return response.data.data;
  }, [applySession]);

  const saveProfile = useCallback(async (payload) => {
    try {
      const response = await api.put("/profiles/me", payload);
      setProfile(response.data.data);
      persistSession(user, response.data.data);
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }, [persistSession, user]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      resetSession();
      setLoading(false);
    }
  }, [resetSession]);

  const value = useMemo(
    () => ({
      token,
      user,
      profile,
      loading,
      isAdmin: user?.role === "admin",
      login,
      register,
      demoLogin,
      saveProfile,
      refresh,
      logout
    }),
    [token, user, profile, loading, login, register, demoLogin, saveProfile, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
