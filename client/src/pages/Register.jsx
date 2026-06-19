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
    if (form.password.length < 6) nextErrors.password = "Password must be at least 6 characters";
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
      showToast("Account created. Build your gamer profile.");
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
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2">
        <div>
          <div className="eyebrow mb-4">Create your player card</div>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Your squad fit starts with profile data.</h1>
          <p className="mt-5 max-w-xl text-clutch-muted">Register, complete onboarding, and ClutchQ turns your rank, role, schedule, and trust history into visible match intelligence.</p>
        </div>
        <form onSubmit={submit} className="card space-y-4 p-6">
          <h2 className="text-2xl font-black">Register</h2>
          {field("name", "Name")}
          {field("email", "Email", "email")}
          {field("password", "Password", "password")}
          {field("confirmPassword", "Confirm Password", "password")}
          <button disabled={loading} className="btn-primary w-full" type="submit">
            Create Account
          </button>
          <p className="text-sm text-clutch-muted">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-clutch-cyan">
              Login
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default Register;
