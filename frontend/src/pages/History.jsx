import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

import LoadingSpinner from "../components/LoadingSpinner";
import ScanTable from "../components/ScanTable";
import { useAuthStore } from "../store/authStore";
import { useScanStore } from "../store/scanStore";

export default function History() {
  const user = useAuthStore((state) => state.user);
  const scans = useScanStore((state) => state.scans);
  const fetchHistory = useScanStore((state) => state.fetchHistory);
  const isLoading = useScanStore((state) => state.isLoading);
  const error = useScanStore((state) => state.error);

  useEffect(() => {
    fetchHistory().catch(() => undefined);
  }, [fetchHistory]);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            {user?.role === "doctor" ? "All patients" : "My scans"}
          </p>
          <h2 className="text-2xl font-semibold">Scan History</h2>
        </div>
        <button
          className="btn btn-outline btn-sm gap-2 rounded-md"
          disabled={isLoading}
          onClick={() => fetchHistory().catch(() => undefined)}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>

      {isLoading ? (
        <div className="app-surface rounded-lg p-4">
          <LoadingSpinner label="Loading history" />
        </div>
      ) : (
        <ScanTable scans={scans} showPatient={user?.role === "doctor"} />
      )}

      {error && <div className="alert alert-error rounded-lg text-white">{error}</div>}
    </div>
  );
}
