import { useState } from "react";
import { resetPassword } from "../../services/authSecurityApi";
import { getErrorMessage } from "../../services/api";

const strongEnoughPassword = (value) => value.length >= 8 && /[a-z]/i.test(value) && /\d/.test(value);

const ResetPasswordPanel = ({ resetToken, onReset }) => {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordsMatch = form.newPassword && form.newPassword === form.confirmPassword;
  const passwordReady = passwordsMatch && strongEnoughPassword(form.newPassword);

  const submit = async () => {
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ resetToken, newPassword: form.newPassword });
      setForm({ newPassword: "", confirmPassword: "" });
      onReset?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
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
      <p className="text-xs leading-5 text-slate-400">Use at least 8 characters with a letter and a number.</p>
      {error ? <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
      <button type="button" className="btn-primary w-full" disabled={loading || !resetToken || !passwordReady} onClick={submit}>
        {loading ? "Resetting..." : "Reset password"}
      </button>
    </div>
  );
};

export default ResetPasswordPanel;
