import { AlertTriangle, CheckCircle2, Download, FileText } from "lucide-react";
import { Link } from "react-router-dom";

import { formatDate, formatPercent } from "../utils/format";

export default function ResultPanel({ scan, onDownloadReport }) {
  if (!scan) {
    return null;
  }

  const isPneumonia = scan.prediction === "PNEUMONIA";
  const confidenceValue = Math.round(Number(scan.confidence || 0) * 100);

  return (
    <section className="app-surface rounded-lg p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-secondary">{formatDate(scan.createdAt)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={[
                "badge gap-1 px-3 py-3 text-sm font-semibold",
                isPneumonia ? "badge-error text-white" : "badge-success text-white",
              ].join(" ")}
            >
              {isPneumonia ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
              {scan.prediction}
            </span>
            <span className="badge badge-outline px-3 py-3">
              Confidence {formatPercent(scan.confidence)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link className="btn btn-ghost btn-sm gap-2 rounded-md" to={`/scans/${scan.id}`}>
            <FileText size={16} />
            Details
          </Link>
          {onDownloadReport && (
            <button
              className="btn btn-outline btn-sm gap-2 rounded-md"
              onClick={() => onDownloadReport(scan.id)}
            >
              <Download size={16} />
              PDF
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-secondary">Confidence</span>
          <span className="font-medium">{confidenceValue}%</span>
        </div>
        <progress
          className={["progress h-3", isPneumonia ? "progress-error" : "progress-success"].join(
            " "
          )}
          value={confidenceValue}
          max="100"
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium">Original X-ray</p>
          <div className="xray-frame">
            <img src={scan.imageUrl} alt="Original chest X-ray" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Grad-CAM Heatmap</p>
          <div className="xray-frame">
            <img src={scan.heatmapUrl} alt="Grad-CAM heatmap" />
          </div>
        </div>
      </div>
    </section>
  );
}

