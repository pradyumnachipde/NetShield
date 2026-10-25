
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";

import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import { detectionAPI } from "../services/api";
import {
  formatDate,
  formatConfidence,
  getApiError,
} from "../utils/formatters";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchAlerts() {
      setLoading(true);
      setError("");

      try {
        const response = await detectionAPI.getAlerts({
          page,
          page_size: 50,
        });

        if (active) {
          setAlerts(response.data.results);
          setCount(response.data.count);
        }
      } catch (err) {
        if (active) setError(getApiError(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchAlerts();

    return () => { active = false; };
  }, [page]);

  return (
    <div>
      <PageHeader
        title="Security Alerts"
        description="Network flows classified as suspicious by the MLP model."
      />

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <TriangleAlert className="text-red-400" size={22} />
        <p className="text-sm text-slate-300">
          These are model-generated alerts, not confirmed security incidents.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#101a2b]">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <p className="p-5 text-red-400">{error}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/70 text-xs uppercase text-slate-500">
                  <tr>
                    {["Flow #", "Predicted Attack", "Confidence", "Detected At", "Analysis"].map(
                      (heading) => (
                        <th key={heading} className="px-5 py-4">{heading}</th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="border-t border-slate-800">
                      <td className="px-5 py-4 text-slate-400">
                        {alert.flow_index}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge
                          suspicious
                          label={alert.predicted_label}
                        />
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {formatConfidence(alert.confidence)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                        {formatDate(alert.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/history/${alert.upload}`}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          View Upload
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {alerts.length === 0 && (
                <p className="p-8 text-center text-slate-500">
                  No suspicious flows found.
                </p>
              )}
            </div>

            <Pagination
              page={page}
              count={count}
              pageSize={50}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
