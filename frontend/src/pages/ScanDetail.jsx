import { Download, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import LoadingSpinner from "../components/LoadingSpinner";
import ResultPanel from "../components/ResultPanel";
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

export default function ScanDetail() {
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);
  const currentScan = useScanStore((state) => state.currentScan);
  const fetchScanById = useScanStore((state) => state.fetchScanById);
  const updateDoctorNote = useScanStore((state) => state.updateDoctorNote);
  const isLoading = useScanStore((state) => state.isLoading);
  const error = useScanStore((state) => state.error);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchScanById(id)
      .then((scan) => setNote(scan.doctorNote || ""))
      .catch(() => undefined);
  }, [fetchScanById, id]);

  const saveNote = async () => {
    setSaving(true);
    try {
      const scan = await updateDoctorNote(id, note);
      setNote(scan.doctorNote || "");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !currentScan) {
    return (
      <div className="app-surface rounded-lg p-4">
        <LoadingSpinner label="Loading scan" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Scan detail</p>
          <h2 className="text-2xl font-semibold">
            {currentScan?.patient?.name || "Patient scan"}
          </h2>
        </div>
        <button
          className="btn btn-outline btn-sm gap-2 rounded-md"
          disabled={!currentScan}
          onClick={() => downloadReport(id)}
        >
          <Download size={16} />
          Download PDF
        </button>
      </section>

      {error && <div className="alert alert-error rounded-lg text-white">{error}</div>}

      <ResultPanel scan={currentScan} />

      {currentScan && (
        <section className="app-surface rounded-lg p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Doctor's Note</h3>
            {user?.role === "doctor" && (
              <button
                className="btn btn-primary btn-sm gap-2 rounded-md"
                disabled={saving}
                onClick={saveNote}
              >
                <Save size={16} />
                {saving ? "Saving" : "Save"}
              </button>
            )}
          </div>
          <textarea
            className="textarea textarea-bordered min-h-32 w-full rounded-md"
            disabled={user?.role !== "doctor"}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add clinical note"
          />
        </section>
      )}
    </div>
  );
}
