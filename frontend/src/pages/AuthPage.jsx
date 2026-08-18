import { Activity, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuthStore } from "../store/authStore";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "patient",
};

export default function AuthPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.error);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(emptyForm);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload =
      mode === "signup"
        ? form
        : {
            email: form.email,
            password: form.password,
          };

    try {
      if (mode === "signup") {
        await signup(payload);
      } else {
        await login(payload);
      }
      navigate("/dashboard");
    } catch (error) {
      // The store already exposes the API error to the form.
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-base-100 px-4 py-8">
      <section className="app-surface w-full max-w-md rounded-lg p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-content">
            <Activity size={23} />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">
              Pneumonia Detection & Diagnosis Assistant
            </h1>
            <p className="text-sm text-secondary">Secure scan workspace</p>
          </div>
        </div>

        <div className="tabs tabs-boxed mb-5 bg-base-200">
          <button
            className={["tab flex-1", mode === "login" ? "tab-active" : ""].join(" ")}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={["tab flex-1", mode === "signup" ? "tab-active" : ""].join(" ")}
            onClick={() => setMode("signup")}
          >
            Signup
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label className="form-control">
              <span className="label-text mb-1">Name</span>
              <input
                className="input input-bordered rounded-md"
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>
          )}

          <label className="form-control">
            <span className="label-text mb-1">Email</span>
            <input
              className="input input-bordered rounded-md"
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Password</span>
            <input
              className="input input-bordered rounded-md"
              minLength={6}
              required
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </label>

          {mode === "signup" && (
            <label className="form-control">
              <span className="label-text mb-1">Role</span>
              <select
                className="select select-bordered rounded-md"
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </label>
          )}

          {storeError && <p className="text-sm text-error">{storeError}</p>}

          <button className="btn btn-primary w-full gap-2 rounded-md" disabled={isLoading}>
            {mode === "signup" ? <UserPlus size={17} /> : <LogIn size={17} />}
            {isLoading ? "Please wait" : mode === "signup" ? "Create Account" : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
