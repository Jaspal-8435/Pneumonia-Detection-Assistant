import { ClipboardList, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

import LoadingSpinner from "../components/LoadingSpinner";
import ResultPanel from "../components/ResultPanel";
import UploadDropzone from "../components/UploadDropzone";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useScanStore } from "../store/scanStore";

async function downloadReport(scanId) {
  const response = await api.get(`/scans/${scanId}/report`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `pneumonia-report-${scanId}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const currentScan = useScanStore((state) => state.currentScan);
  const uploadScan = useScanStore((state) => state.uploadScan);
  const clearCurrentScan = useScanStore((state) => state.clearCurrentScan);
  const isUploading = useScanStore((state) => state.isUploading);
  const error = useScanStore((state) => state.error);

  const handleUpload = async (file) => {
    clearCurrentScan();
    try {
      await uploadScan(file);
    } catch (error) {
      // The scan store keeps the message visible on the dashboard.
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            {user?.role === "doctor" ? "Doctor dashboard" : "Patient dashboard"}
          </p>
          <h2 className="text-2xl font-semibold">Upload Chest X-ray</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link className="btn btn-outline btn-sm gap-2 rounded-md" to="/history">
            <ClipboardList size={16} />
            Scan History
          </Link>
          {user?.role === "doctor" && (
            <Link className="btn btn-ghost btn-sm gap-2 rounded-md" to="/stats">
              <Stethoscope size={16} />
              System Stats
            </Link>
          )}
        </div>
      </section>

      <UploadDropzone disabled={isUploading} onUpload={handleUpload} />

      {isUploading && (
        <div className="app-surface rounded-lg p-4">
          <LoadingSpinner label="Running prediction" />
        </div>
      )}

      {error && <div className="alert alert-error rounded-lg text-white">{error}</div>}

      <ResultPanel scan={currentScan} onDownloadReport={downloadReport} />
    </div>
  );
}
