import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  const [user, setUser] = useState(() => readStoredJson("clutchq_user"));
  const [profile, setProfile] = useState(() => readStoredJson("clutchq_profile"));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("clutchq_token")));

  const persistSession = (nextUser, nextProfile) => {
    if (nextUser) localStorage.setItem("clutchq_user", JSON.stringify(nextUser));
    if (nextProfile) localStorage.setItem("clutchq_profile", JSON.stringify(nextProfile));
  };

  const applySession = (payload) => {
    if (payload?.token) {
      localStorage.setItem("clutchq_token", payload.token);
      setToken(payload.token);
    }
    setUser(payload?.user || null);
    setProfile(payload?.profile || null);
    persistSession(payload?.user, payload?.profile);
  };

  const refresh = async () => {
    if (!localStorage.getItem("clutchq_token")) {
      setLoading(false);
      return { user, profile };
    }

    setLoading(true);
    try {
      const response = await Promise.race([
        api.get("/auth/me"),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error("Auth refresh timed out")), 8000))
      ]);
      setUser(response.data.data.user);
      setProfile(response.data.data.profile);
      persistSession(response.data.data.user, response.data.data.profile);
      return response.data.data;
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        clearStoredSession();
        setToken(null);
        setUser(null);
        setProfile(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      profile,
      loading,
      isAdmin: user?.role === "admin",
      login: async (credentials) => {
        const response = await api.post("/auth/login", credentials);
        applySession(response.data.data);
        return response.data.data;
      },
      register: async (payload) => {
        const response = await api.post("/auth/register", payload);
        applySession(response.data.data);
        return response.data.data;
      },
      demoLogin: async () => {
        const response = await api.post("/auth/demo");
        applySession(response.data.data);
        return response.data.data;
      },
      saveProfile: async (payload) => {
        const previous = profile;
        setProfile({ ...previous, ...payload });
        try {
          const response = await api.put("/profiles/me", payload);
          setProfile(response.data.data);
          persistSession(user, response.data.data);
          return response.data.data;
        } catch (error) {
          setProfile(previous);
          throw new Error(getErrorMessage(error));
        }
      },
      refresh,
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } finally {
          clearStoredSession();
          setToken(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    }),
    [token, user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
