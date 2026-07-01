import { useCallback, useState } from "react";
import { requestOtp } from "../../services/authSecurityApi";
import { getErrorMessage } from "../../services/api";
import TurnstileWidget from "../security/TurnstileWidget";

const OtpRequestPanel = ({ email, purpose = "email_verification", buttonLabel = "Get OTP", onRequested }) => {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await requestOtp({ email, purpose, turnstileToken });
      setMessage(response.data.message || "Code sent if the email can receive it.");
      setTurnstileToken("");
      setResetKey((current) => current + 1);
      onRequested?.(response.data.data || {});
    } catch (err) {
      setError(getErrorMessage(err));
      setTurnstileToken("");
      setResetKey((current) => current + 1);
    } finally {
      setLoading(false);
    }
  }, [email, onRequested, purpose, turnstileToken]);

  return (
    <div className="space-y-3">
      <TurnstileWidget key={resetKey} resetKey={resetKey} onVerify={setTurnstileToken} onClear={() => setTurnstileToken("")} />
      {message ? <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{message}</p> : null}
      {error ? <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
      <button type="button" className="btn-primary w-full" disabled={loading || !email || !turnstileToken} onClick={submit}>
        {loading ? "Sending..." : buttonLabel}
      </button>
    </div>
  );
};

export default OtpRequestPanel;
