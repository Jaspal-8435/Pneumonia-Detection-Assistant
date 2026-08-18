import { Activity, AlertTriangle, CheckCircle2, Percent } from "lucide-react";
import { useEffect } from "react";

import LoadingSpinner from "../components/LoadingSpinner";
import ScanTable from "../components/ScanTable";
import { useScanStore } from "../store/scanStore";
import { formatPercent } from "../utils/format";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="app-surface rounded-lg p-4">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-base-200 text-primary">
        <Icon size={20} />
      </div>
      <p className="text-sm text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminStats() {
  const stats = useScanStore((state) => state.stats);
  const fetchStats = useScanStore((state) => state.fetchStats);
  const isLoading = useScanStore((state) => state.isLoading);
  const error = useScanStore((state) => state.error);

  useEffect(() => {
    fetchStats().catch(() => undefined);
  }, [fetchStats]);

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-medium text-primary">Doctor view</p>
        <h2 className="text-2xl font-semibold">System Stats</h2>
      </section>

      {isLoading && !stats ? (
        <div className="app-surface rounded-lg p-4">
          <LoadingSpinner label="Loading stats" />
        </div>
      ) : (
        stats && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Activity} label="Total scans" value={stats.totalScans} />
              <StatCard
                icon={AlertTriangle}
                label="Pneumonia scans"
                value={stats.pneumoniaScans}
              />
              <StatCard icon={CheckCircle2} label="Normal scans" value={stats.normalScans} />
              <StatCard
                icon={Percent}
                label="Pneumonia rate"
                value={formatPercent(stats.pneumoniaRate)}
              />
            </div>
            <div>
              <h3 className="mb-3 text-lg font-semibold">Recent Scans</h3>
              <ScanTable scans={stats.recentScans || []} showPatient />
            </div>
          </>
        )
      )}

      {error && <div className="alert alert-error rounded-lg text-white">{error}</div>}
    </div>
  );
}
