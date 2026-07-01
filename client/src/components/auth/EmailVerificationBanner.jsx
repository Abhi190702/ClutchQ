import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import OtpRequestPanel from "./OtpRequestPanel";
import OtpVerifyPanel from "./OtpVerifyPanel";

const EmailVerificationBanner = () => {
  const { user, refresh } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);

  if (!user || user.emailVerified) return null;

  const handleVerified = async () => {
    await refresh();
    setOpen(false);
    setRequested(false);
    showToast("Email verified. Your account is secured.");
  };

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] px-4 py-4 shadow-[0_14px_50px_rgba(0,0,0,0.16)] md:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-200">Email security</p>
          <h2 className="mt-1 text-xl font-black text-white">Verify your email to secure your ClutchQ account.</h2>
          <p className="mt-1 text-sm text-slate-300">{user.email}</p>
        </div>
        <button type="button" className="btn-primary shrink-0" onClick={() => setOpen((current) => !current)}>
          {open ? "Close" : "Verify now"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 md:grid-cols-2">
          <OtpRequestPanel email={user.email} buttonLabel={requested ? "Resend OTP" : "Get OTP"} onRequested={() => setRequested(true)} />
          <OtpVerifyPanel email={user.email} onVerified={handleVerified} />
        </div>
      ) : null}
    </section>
  );
};

export default EmailVerificationBanner;
