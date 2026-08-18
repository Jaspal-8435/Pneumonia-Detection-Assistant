import { Activity, BarChart3, ClipboardList, LogOut, UploadCloud } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuthStore } from "../store/authStore";

function navClass({ isActive }) {
  return [
    "btn btn-sm justify-start gap-2 rounded-md",
    isActive ? "btn-primary" : "btn-ghost",
  ].join(" ");
}

export default function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-base-100">
      <header className="border-b border-base-300 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-content">
              <Activity size={22} />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                Pneumonia Detection & Diagnosis Assistant
              </h1>
              <p className="text-sm text-secondary">{user?.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-outline capitalize">{user?.role}</span>
            <button className="btn btn-ghost btn-sm gap-2 rounded-md" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[220px_1fr] lg:px-6">
        <nav className="app-surface flex h-fit gap-2 rounded-lg p-2 lg:flex-col">
          <NavLink className={navClass} to="/dashboard">
            <UploadCloud size={16} />
            Dashboard
          </NavLink>
          <NavLink className={navClass} to="/history">
            <ClipboardList size={16} />
            History
          </NavLink>
          {user?.role === "doctor" && (
            <NavLink className={navClass} to="/stats">
              <BarChart3 size={16} />
              Stats
            </NavLink>
          )}
        </nav>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

