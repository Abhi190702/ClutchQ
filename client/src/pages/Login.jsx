import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../services/api";

const Login = () => {
  const [form, setForm] = useState({ email: "demo@clutchq.com", password: "demo123" });
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterAuth = (profile) => {
    navigate(profile ? location.state?.from?.pathname || "/dashboard" : "/onboarding", { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await login(form);
      showToast("Logged in successfully");
      redirectAfterAuth(data.profile);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const continueDemo = async () => {
    setLoading(true);
    try {
      const data = await demoLogin();
      showToast("Demo player loaded");
      redirectAfterAuth(data.profile);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="noise-bg min-h-screen">
      <Navbar />
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2">
        <div>
          <div className="eyebrow mb-4">Demo-ready login</div>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Start with the right squad.</h1>
          <p className="mt-5 max-w-xl text-clutch-muted">Use the demo player to see seeded recommendations, lobby fit, reviews, and admin analytics instantly.</p>
        </div>
        <form onSubmit={submit} className="card p-6">
          <h2 className="mb-6 text-2xl font-black">Login</h2>
          <label className="form-label">Email</label>
          <input className="form-input mb-4" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <label className="form-label">Password</label>
          <input className="form-input mb-5" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <button disabled={loading} className="btn-primary w-full" type="submit">
            Login
          </button>
          <button disabled={loading} type="button" onClick={continueDemo} className="btn-secondary mt-3 w-full">
            Continue as Demo Player
          </button>
          <p className="mt-5 text-sm text-clutch-muted">
            New here?{" "}
            <Link to="/register" className="font-semibold text-clutch-cyan">
              Create an account
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default Login;
