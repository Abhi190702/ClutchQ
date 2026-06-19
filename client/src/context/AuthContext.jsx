import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("clutchq_token"));
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const applySession = (payload) => {
    if (payload?.token) {
      localStorage.setItem("clutchq_token", payload.token);
      setToken(payload.token);
    }
    setUser(payload?.user || null);
    setProfile(payload?.profile || null);
  };

  const refresh = async () => {
    if (!localStorage.getItem("clutchq_token")) {
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.data.user);
      setProfile(response.data.data.profile);
      return response.data.data;
    } catch (error) {
      localStorage.removeItem("clutchq_token");
      setToken(null);
      setUser(null);
      setProfile(null);
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
          return response.data.data;
        } catch (error) {
          setProfile(previous);
          throw new Error(getErrorMessage(error));
        }
      },
      refresh,
      logout: () => {
        localStorage.removeItem("clutchq_token");
        setToken(null);
        setUser(null);
        setProfile(null);
      }
    }),
    [token, user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
