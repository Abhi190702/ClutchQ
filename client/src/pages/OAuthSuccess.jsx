import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  useEffect(() => {
    const completeSignIn = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const next = params.get("next");
      const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : null;

      if (!token) {
        navigate("/login?error=oauth_failed", { replace: true });
        return;
      }

      localStorage.setItem("clutchq_token", token);
      window.history.replaceState({}, "", "/oauth/success");

      try {
        const response = await api.get("/auth/me");
        const { user, profile } = response.data.data;
        localStorage.setItem("clutchq_user", JSON.stringify(user));
        if (profile) localStorage.setItem("clutchq_profile", JSON.stringify(profile));
        await refresh();
        navigate(nextPath || (profile ? "/dashboard" : "/onboarding"), { replace: true });
      } catch {
        localStorage.removeItem("clutchq_token");
        localStorage.removeItem("clutchq_user");
        localStorage.removeItem("clutchq_profile");
        navigate("/login?error=oauth_failed", { replace: true });
      }
    };

    completeSignIn();
  }, [navigate, refresh]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#101116] px-4 text-white">
      <div className="w-full max-w-sm rounded-md border border-[#2d2e35] bg-[#1b1c22] p-6 text-center">
        <img src="/clutchq-logo.svg" alt="ClutchQ" className="mx-auto h-12 w-12 rounded-xl" />
        <h1 className="mt-5 text-2xl font-semibold">Completing sign in...</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Hold tight while ClutchQ secures your session.</p>
      </div>
    </main>
  );
};

export default OAuthSuccess;
