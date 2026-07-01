import { useState } from "react";
import { forgotPassword } from "../../services/authSecurityApi";
import { getErrorMessage } from "../../services/api";
import TurnstileWidget from "../security/TurnstileWidget";
import ResetPasswordPanel from "./ResetPasswordPanel";

const ForgotPasswordPanel = ({ initialEmail = "", onDone }) => {
  const [email, setEmail] = useState(initialEmail);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requestReset = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await forgotPassword({ email, turnstileToken });
      setMessage(response.data.message || "If this email can receive a code, an OTP has been sent.");
      setSent(true);
      setTurnstileToken("");
      setResetKey((current) => current + 1);
    } catch (err) {
      setError(getErrorMessage(err));
      setTurnstileToken("");
      setResetKey((current) => current + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4 text-left">
      <div className="mb-4">
        <h3 className="text-base font-black text-white">{sent ? "Reset your password" : "Forgot password"}</h3>
        <p className="mt-1 text-sm text-slate-400">We will send a one-time code if this email can receive it.</p>
      </div>

      {!sent ? (
        <div className="space-y-3">
          <input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" />
          <TurnstileWidget key={resetKey} resetKey={resetKey} onVerify={setTurnstileToken} onClear={() => setTurnstileToken("")} />
          {error ? <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
          <button type="button" className="btn-primary w-full" disabled={loading || !email || !turnstileToken} onClick={requestReset}>
            {loading ? "Sending..." : "Send reset OTP"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {message ? <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{message}</p> : null}
          <ResetPasswordPanel email={email} onReset={onDone} />
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPanel;
