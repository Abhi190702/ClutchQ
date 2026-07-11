import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../services/api";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.email.includes("@")) nextErrors.email = "Valid email is required";
    if (form.password.length < 8 || !/[a-z]/i.test(form.password) || !/\d/.test(form.password)) {
      nextErrors.password = "Use at least 8 characters with a letter and a number";
    }
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      showToast("Account created. Verify your email when you land inside ClutchQ.");
      navigate("/onboarding");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = "text") => (
    <div>
      <label className="form-label">{label}</label>
      <input
        className={`form-input ${errors[name] ? "border-clutch-red" : ""}`}
        type={type}
        value={form[name]}
        onChange={(event) => setForm({ ...form, [name]: event.target.value })}
      />
      {errors[name] && <p className="mt-2 text-xs text-red-200">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="noise-bg min-h-screen">
      <Navbar />
      <main className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1180px] items-center gap-12 px-4 py-14 md:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="max-w-xl">
          <div className="eyebrow mb-4">Create your identity</div>
          <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.055em] text-white md:text-7xl">Build the profile your next squad can trust.</h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">Start with the basics, then add games, ranks, roles, availability, Steam history, and voice preferences.</p>
          <div className="mt-8 grid grid-cols-2 gap-5 border-t border-white/[0.08] pt-6 text-sm font-bold text-zinc-300">
            <span>Rank-aware matching</span>
            <span>Steam-ready identity</span>
            <span>Discord voice rooms</span>
            <span>Gameplay history</span>
          </div>
        </section>
        <form onSubmit={submit} className="card w-full space-y-5 p-6 sm:p-8">
          <div>
            <div className="eyebrow mb-3">New account</div>
            <h2 className="text-3xl font-black tracking-[-0.035em] text-clutch-text">Create your player profile</h2>
            <p className="mt-2 text-sm leading-6 text-clutch-muted">Add the basics now, then finish your game, rank, role, and availability in onboarding.</p>
          </div>
          {field("name", "Name")}
          {field("email", "Email", "email")}
          {field("password", "Password", "password")}
          {field("confirmPassword", "Confirm Password", "password")}
          <button disabled={loading} className="btn-primary w-full py-3" type="submit">
            Create Account
          </button>
          <p className="text-sm text-clutch-muted">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-clutch-blue">
              Login
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default Register;
