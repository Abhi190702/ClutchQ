import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";

const EmailLoginPanel = forwardRef(function EmailLoginPanel(_, ref) {
  const [form, setForm] = useState({ email: "demo@clutchq.com", password: "demo123" });
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const emailInputRef = useRef(null);
  const { login, demoLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterAuth = (profile) => {
    navigate(profile ? location.state?.from?.pathname || "/dashboard" : "/onboarding", { replace: true });
  };

  const submit = async (event) => {
    event?.preventDefault();
    setErrorText("");
    setLoading(true);
    try {
      const data = await login(form);
      showToast("Logged in successfully");
      redirectAfterAuth(data.profile);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorText(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const continueDemo = async () => {
    setErrorText("");
    setLoading(true);
    try {
      const data = await demoLogin();
      showToast("Demo player loaded");
      redirectAfterAuth(data.profile);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorText(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    focusEmail: () => emailInputRef.current?.focus(),
    continueDemo
  }));

  return (
    <form onSubmit={submit} className="rounded-md border border-[#2d2e35] bg-[#1b1c22] p-5 md:p-6">
      <div className="mb-5 text-center">
        <h2 className="text-lg font-semibold text-white">Email sign in</h2>
        <p className="mt-2 text-sm text-slate-400">Use your ClutchQ account or load the seeded demo profile.</p>
      </div>

      {errorText && <div className="mb-4 rounded-md border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">{errorText}</div>}

      <label className="form-label text-slate-300" htmlFor="login-email">Email</label>
      <input
        id="login-email"
        ref={emailInputRef}
        className="form-input mb-4 border-[#3a3c45] bg-[#202127]"
        value={form.email}
        onChange={(event) => setForm({ ...form, email: event.target.value })}
      />

      <label className="form-label text-slate-300" htmlFor="login-password">Password</label>
      <input
        id="login-password"
        className="form-input mb-5 border-[#3a3c45] bg-[#202127]"
        type="password"
        value={form.password}
        onChange={(event) => setForm({ ...form, password: event.target.value })}
      />

      <button disabled={loading} className="btn-primary w-full" type="submit">
        {loading ? "Signing in..." : "Continue with Email"}
      </button>
      <button disabled={loading} type="button" onClick={continueDemo} className="btn-secondary mt-3 w-full border-[#3a3c45] bg-[#202127]">
        Continue as Demo Player
      </button>

      <p className="mt-5 text-center text-sm text-slate-400">
        New to ClutchQ?{" "}
        <Link to="/register" className="font-semibold text-clutch-blue">
          Create account
        </Link>
      </p>
    </form>
  );
});

export default EmailLoginPanel;
