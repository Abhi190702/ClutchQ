import { useEffect, useMemo, useRef, useState } from "react";

const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const DEV_TOKEN = "dev-turnstile-bypass";

const ensureScript = () =>
  new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }

    const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.turnstile), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = reject;
    document.head.appendChild(script);
  });

const TurnstileWidget = ({ onVerify, onClear, resetKey = 0 }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onClearRef = useRef(onClear);
  const [error, setError] = useState("");
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const isProduction = import.meta.env.PROD;
  const hasSiteKey = Boolean(siteKey);

  const fallbackText = useMemo(() => {
    if (hasSiteKey) return "";
    return isProduction ? "Security check is not configured yet." : "Development security check bypassed.";
  }, [hasSiteKey, isProduction]);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onClearRef.current = onClear;
  }, [onClear, onVerify]);

  useEffect(() => {
    if (!hasSiteKey) {
      if (!isProduction) onVerifyRef.current?.(DEV_TOKEN);
      else onClearRef.current?.();
      return undefined;
    }

    let disposed = false;
    setError("");
    onClearRef.current?.();

    ensureScript()
      .then((turnstile) => {
        if (disposed || !containerRef.current || !turnstile) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token) => onVerifyRef.current?.(token),
          "expired-callback": () => onClearRef.current?.(),
          "error-callback": () => {
            onClearRef.current?.();
            setError("Security check failed to load. Please retry.");
          }
        });
      })
      .catch(() => {
        onClearRef.current?.();
        setError("Security check failed to load. Please retry.");
      });

    return () => {
      disposed = true;
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [hasSiteKey, isProduction, resetKey, siteKey]);

  if (!hasSiteKey) {
    return (
      <div className={`rounded-xl border px-3 py-2 text-sm ${isProduction ? "border-red-400/35 bg-red-500/10 text-red-100" : "border-white/10 bg-white/[0.04] text-clutch-muted"}`}>
        {fallbackText}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="min-h-[65px]" />
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
    </div>
  );
};

export default TurnstileWidget;
