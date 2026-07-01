import { useState } from "react";
import { resetPassword } from "../../services/authSecurityApi";
import { getErrorMessage } from "../../services/api";

const ResetPasswordPanel = ({ email, onReset }) => {
  const [form, setForm] = useState({ otp: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email, otp: form.otp, newPassword: form.newPassword });
      setForm({ otp: "", newPassword: "", confirmPassword: "" });
      onReset?.();
    } catch (err) {
      setError(getErrorMessage(err));
      setForm((current) => ({ ...current, otp: "" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        className="form-input text-center text-lg font-black tracking-[0.32em]"
        inputMode="numeric"
        maxLength={6}
        value={form.otp}
        onChange={(event) => setForm({ ...form, otp: event.target.value.replace(/\D/g, "").slice(0, 6) })}
        placeholder="OTP code"
      />
      <input
        className="form-input"
        type="password"
        value={form.newPassword}
        onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
        placeholder="New password"
      />
      <input
        className="form-input"
        type="password"
        value={form.confirmPassword}
        onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
        placeholder="Confirm password"
      />
      {error ? <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
      <button type="button" className="btn-primary w-full" disabled={loading || form.otp.length !== 6 || !form.newPassword} onClick={submit}>
        {loading ? "Resetting..." : "Reset password"}
      </button>
    </div>
  );
};

export default ResetPasswordPanel;
