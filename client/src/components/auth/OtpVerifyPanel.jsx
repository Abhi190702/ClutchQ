import { useState } from "react";
import { verifyOtp } from "../../services/authSecurityApi";
import { getErrorMessage } from "../../services/api";

const OtpVerifyPanel = ({ email, purpose = "email_verification", onVerified }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await verifyOtp({ email, purpose, otp });
      setOtp("");
      onVerified?.(response.data.data || {});
    } catch (err) {
      setError(getErrorMessage(err));
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="form-label">Verification code</label>
        <input
          className="form-input text-center text-xl font-black tracking-[0.35em]"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
        />
      </div>
      {error ? <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
      <button type="button" className="btn-secondary w-full" disabled={loading || otp.length !== 6} onClick={submit}>
        {loading ? "Verifying..." : "Verify email"}
      </button>
    </div>
  );
};

export default OtpVerifyPanel;
