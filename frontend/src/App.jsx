import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import ScanDetail from "./pages/ScanDetail";
import AdminStats from "./pages/AdminStats";
import { useAuthStore } from "./store/authStore";

function DoctorOnly({ children }) {
  const user = useAuthStore((state) => state.user);
  return user?.role === "doctor" ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="history" element={<History />} />
        <Route path="scans/:id" element={<ScanDetail />} />
        <Route
          path="stats"
          element={
            <DoctorOnly>
              <AdminStats />
            </DoctorOnly>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

