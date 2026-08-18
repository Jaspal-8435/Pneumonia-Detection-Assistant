import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import LoadingSpinner from "./LoadingSpinner";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [checking, setChecking] = useState(Boolean(token && !user));

  useEffect(() => {
    if (!token || user) {
      setChecking(false);
      return;
    }

    refreshProfile().finally(() => setChecking(false));
  }, [refreshProfile, token, user]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Checking session" />
      </main>
    );
  }

  return children;
}

