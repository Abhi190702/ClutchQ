import { useEffect, useMemo, useState } from "react";
import { forgotPassword, verifyPasswordResetOtp } from "../../services/authSecurityApi";
import { getErrorMessage } from "../../services/api";
import TurnstileWidget from "../security/TurnstileWidget";
import ResetPasswordPanel from "./ResetPasswordPanel";

const STEPS = {
  EMAIL: "email",
  OTP: "otp",
  NEW_PASSWORD: "new_password",
  DONE: "done"
};

const stepLabels = [
  { id: STEPS.EMAIL, label: "Email" },
  { id: STEPS.OTP, label: "Code" },
  { id: STEPS.NEW_PASSWORD, label: "Password" }
];

const stepRank = {
  [STEPS.EMAIL]: 0,
  [STEPS.OTP]: 1,
  [STEPS.NEW_PASSWORD]: 2,
  [STEPS.DONE]: 3
};

const ForgotPasswordPanel = ({ initialEmail = "", onDone }) => {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [resetToken, setResetToken] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [helperOpen, setHelperOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const activeRank = stepRank[step];
  const safeEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const clearTurnstile = () => {
    setTurnstileToken("");
    setResetKey((current) => current + 1);
  };

  const requestReset = async ({ resend = false } = {}) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await forgotPassword({ email: safeEmail, turnstileToken });
      setMessage(response.data.message || "If this email can receive a code, an OTP has been sent.");
      setCooldown(Number(response.data.data?.retryAfterSeconds || 60));
      setStep(STEPS.OTP);
      setHelperOpen(false);
      if (!resend) setOtp("");
      clearTurnstile();
    } catch (err) {
      setError(getErrorMessage(err));
      clearTurnstile();
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await verifyPasswordResetOtp({ email: safeEmail, otp });
      setResetToken(response.data.data?.resetToken || "");
      setOtp("");
      setMessage("Code verified. Choose a new password.");
      setStep(STEPS.NEW_PASSWORD);
    } catch (err) {
      setError(getErrorMessage(err));
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResetDone = () => {
    setResetToken("");
    setMessage("");
    setError("");
    setStep(STEPS.DONE);
  };

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4 text-left">
      <div className="mb-5 flex items-center gap-2">
        {stepLabels.map((item, index) => {
          const active = activeRank >= index;
          return (
            <div key={item.id} className="flex flex-1 items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${active ? "bg-clutch-blue text-black" : "bg-white/10 text-slate-400"}`}>
                {index + 1}
              </div>
              <span className={`hidden text-xs font-black uppercase tracking-[0.16em] sm:inline ${active ? "text-white" : "text-slate-500"}`}>{item.label}</span>
              {index < stepLabels.length - 1 ? <div className={`h-px flex-1 ${activeRank > index ? "bg-clutch-blue" : "bg-white/10"}`} /> : null}
            </div>
          );
        })}
      </div>

      {step === STEPS.EMAIL ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-black text-white">Reset your password</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">Enter your email and complete the security check. If the email can receive a code, we will send one.</p>
          </div>
          <input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" />
          <TurnstileWidget key={resetKey} resetKey={resetKey} onVerify={setTurnstileToken} onClear={() => setTurnstileToken("")} />
          {error ? <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
          <button type="button" className="btn-primary w-full" disabled={loading || !safeEmail || !turnstileToken} onClick={() => requestReset()}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      ) : null}

      {step === STEPS.OTP ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-black text-white">Check your email</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">Enter the 6-digit code we sent. Password fields stay locked until the code is verified.</p>
            <p className="mt-1 text-xs text-slate-500">{safeEmail}</p>
          </div>
          {message ? <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{message}</p> : null}
          <input
            className="form-input text-center text-lg font-black tracking-[0.32em]"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="OTP code"
          />
          {error ? <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
          <button type="button" className="btn-primary w-full" disabled={loading || otp.length !== 6} onClick={verifyCode}>
            {loading ? "Checking..." : "Verify code"}
          </button>

          <div className="rounded-xl border border-white/10 bg-white/[0.03]">
            <button type="button" className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-black text-white" onClick={() => setHelperOpen((current) => !current)}>
              I didn't get a code
              <span className="text-slate-400">{helperOpen ? "-" : "+"}</span>
            </button>
            {helperOpen ? (
              <div className="space-y-3 border-t border-white/10 px-3 py-3 text-sm leading-6 text-slate-300">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Check spam, junk, or promotions.</li>
                  <li>Wait 60 seconds before requesting another code.</li>
                  <li>Make sure the email is typed correctly.</li>
                  <li>Use the same email you used for your ClutchQ account.</li>
                  <li>If you requested too many codes, wait a few minutes.</li>
                  <li>If it still does not arrive, contact support or the project admin.</li>
                </ul>
                <TurnstileWidget key={resetKey} resetKey={resetKey} onVerify={setTurnstileToken} onClear={() => setTurnstileToken("")} />
                <button
                  type="button"
                  className="btn-secondary w-full"
                  disabled={loading || cooldown > 0 || !turnstileToken}
                  onClick={() => requestReset({ resend: true })}
                >
                  {cooldown > 0 ? `Resend available in ${cooldown}s` : loading ? "Sending..." : "Resend code"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === STEPS.NEW_PASSWORD ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-black text-white">Set new password</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">Your code is verified. Choose a new password for your ClutchQ account.</p>
          </div>
          {message ? <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{message}</p> : null}
          <ResetPasswordPanel resetToken={resetToken} onReset={handleResetDone} />
        </div>
      ) : null}

      {step === STEPS.DONE ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-black text-white">Password reset complete</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">You can now sign in with your new password.</p>
          </div>
          <button type="button" className="btn-primary w-full" onClick={onDone}>
            Back to login
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ForgotPasswordPanel;
