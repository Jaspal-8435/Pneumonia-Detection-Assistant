import { Eye } from "lucide-react";
import { Link } from "react-router-dom";

import { formatDate, formatPercent } from "../utils/format";

export default function ScanTable({ scans, showPatient }) {
  if (!scans.length) {
    return (
      <div className="app-surface rounded-lg p-8 text-center text-secondary">
        No scans have been uploaded yet.
      </div>
    );
  }

  return (
    <div className="app-surface overflow-x-auto rounded-lg">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            {showPatient && <th>Patient</th>}
            <th>Prediction</th>
            <th>Confidence</th>
            <th className="text-right">Open</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => {
            const isPneumonia = scan.prediction === "PNEUMONIA";
            return (
              <tr key={scan.id} className="hover">
                <td>{formatDate(scan.createdAt)}</td>
                {showPatient && <td>{scan.patient?.name || "Unknown"}</td>}
                <td>
                  <span
                    className={[
                      "badge font-medium",
                      isPneumonia ? "badge-error text-white" : "badge-success text-white",
                    ].join(" ")}
                  >
                    {scan.prediction}
                  </span>
                </td>
                <td>{formatPercent(scan.confidence)}</td>
                <td className="text-right">
                  <Link className="btn btn-ghost btn-xs rounded-md" to={`/scans/${scan.id}`}>
                    <Eye size={15} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

