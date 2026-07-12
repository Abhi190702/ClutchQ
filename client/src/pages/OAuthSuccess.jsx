import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const { completeSession } = useAuth();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const completeSignIn = async () => {
      const previousToken = localStorage.getItem("clutchq_token");
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const next = params.get("next");
      const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : null;
      window.history.replaceState({}, "", "/oauth/success");

      if (!code) {
        navigate("/login?error=oauth_failed", { replace: true });
        return;
      }

      try {
        const response = await api.post("/auth/oauth/exchange", { code });
        const { profile } = response.data.data;
        completeSession(response.data.data);
        navigate(nextPath || (profile ? "/dashboard" : "/onboarding"), { replace: true });
      } catch {
        if (!previousToken) {
          localStorage.removeItem("clutchq_token");
          localStorage.removeItem("clutchq_user");
          localStorage.removeItem("clutchq_profile");
        }
        navigate("/login?error=oauth_failed", { replace: true });
      }
    };

    completeSignIn();
  }, [completeSession, navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#101116] px-4 text-white">
      <div className="w-full max-w-sm rounded-md border border-[#2d2e35] bg-[#1b1c22] p-6 text-center">
        <img src="/brand/clutchq-logo.png" alt="ClutchQ" className="mx-auto h-14 w-14 rounded-2xl object-cover" />
        <h1 className="mt-5 text-2xl font-semibold">Completing sign in...</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Hold tight while ClutchQ secures your session.</p>
      </div>
    </main>
  );
};

export default OAuthSuccess;
