import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import AuthDivider from "../components/auth/AuthDivider";
import AuthNotice from "../components/auth/AuthNotice";
import AuthProviderGrid from "../components/auth/AuthProviderGrid";
import EmailLoginPanel from "../components/auth/EmailLoginPanel";
import LoginBrandHeader from "../components/auth/LoginBrandHeader";
import { useToast } from "../context/ToastContext";
import { getServerBaseUrl } from "../utils/constants";
import { getConsoleProviders, getOtherProviders } from "../utils/authProviders";

const Login = () => {
  const emailPanelRef = useRef(null);
  const emailPanelWrapRef = useRef(null);
  const { showToast } = useToast();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error === "oauth_failed") showToast("OAuth sign-in failed. Please try again.", "error");
    if (error === "provider_not_configured") showToast("This provider is not configured yet.", "error");

    if (error) window.history.replaceState({}, "", "/login");
  }, [showToast]);

  const handleProviderClick = (provider) => {
    if (provider.status === "oauth" && provider.route) {
      const from = location.state?.from;
      const nextPath = `${from?.pathname || "/dashboard"}${from?.search || ""}`;
      const params = new URLSearchParams({
        returnTo: window.location.origin,
        next: nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard"
      });
      window.location.href = `${getServerBaseUrl()}${provider.route}?${params.toString()}`;
      return;
    }

    if (provider.status === "stub") {
      showToast(`${provider.label} integration is coming next.`, "info");
      return;
    }

    if (provider.status === "manual") {
      showToast(`Manual ${provider.label} linking is coming next. You will be able to add this inside Profile.`, "info");
      return;
    }

    if (provider.status === "local") {
      emailPanelWrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => emailPanelRef.current?.focusEmail(), 250);
      return;
    }

    if (provider.status === "demo") {
      emailPanelRef.current?.continueDemo();
    }
  };

  return (
    <main className="noise-bg relative min-h-screen overflow-hidden px-4 py-10 text-white md:py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[linear-gradient(180deg,rgba(61,187,250,0.07),transparent)]" />
      <div className="relative mx-auto flex max-w-[1120px] flex-col gap-10">
        <LoginBrandHeader />

        <AuthProviderGrid
          title="Only played on console?"
          subtitle="Sign in or connect your console identity"
          providers={getConsoleProviders()}
          onProviderClick={handleProviderClick}
        />

        <AuthDivider label="Other ways to sign in" />

        <AuthProviderGrid
          title="Other ways to sign in"
          subtitle="Choose the account you want to use for your ClutchQ identity."
          providers={getOtherProviders()}
          onProviderClick={handleProviderClick}
        />

        <div ref={emailPanelWrapRef} className="mx-auto w-full max-w-3xl">
          <EmailLoginPanel ref={emailPanelRef} />
        </div>

        <AuthNotice />
      </div>
    </main>
  );
};

export default Login;
