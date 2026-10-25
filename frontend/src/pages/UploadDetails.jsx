
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import { detectionAPI } from "../services/api";
import {
  formatNumber,
  formatConfidence,
  formatDate,
  getApiError,
} from "../utils/formatters";

export default function UploadDetails() {
  const { id } = useParams();

  const [upload, setUpload] = useState(null);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchUpload() {
      try {
        const response = await detectionAPI.getUpload(id);
        if (active) setUpload(response.data);
      } catch (err) {
        if (active) setError(getApiError(err));
      }
    }

    fetchUpload();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;

    async function fetchResults() {
      setLoading(true);
      setError("");

      try {
        const params = { page, page_size: 50 };

        if (filter !== "all") {
          params.suspicious = filter;
        }

        const response = await detectionAPI.getResults(id, params);

        if (active) {
          setResults(response.data.results);
          setCount(response.data.count);
        }
      } catch (err) {
        if (active) setError(getApiError(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchResults();
    return () => { active = false; };
  }, [id, page, filter]);

  return (
    <div>
      <PageHeader
        title="Analysis Details"
        description={
          upload
            ? `${upload.filename} · ${formatDate(upload.uploaded_at)}`
            : "Classification results for the selected upload."
        }
      />

      {upload && (
        <>
          <div className="mb-7 grid gap-5 md:grid-cols-3">
            <StatCard
              title="Total Flows"
              value={formatNumber(upload.total_flows)}
              icon={Activity}
            />
            <StatCard
              title="Benign Flows"
              value={formatNumber(upload.benign_flows)}
              icon={ShieldCheck}
              color="green"
            />
            <StatCard
              title="Suspicious Flows"
              value={formatNumber(upload.suspicious_flows)}
              icon={ShieldAlert}
              color="red"
            />
          </div>

          <div className="mb-7 rounded-2xl border border-slate-800 bg-[#101a2b] p-5">
            <h2 className="mb-4 font-semibold text-white">
              Classification Distribution
            </h2>

            <div className="flex flex-wrap gap-3">
              {Object.entries(upload.classification_distribution || {}).map(
                ([label, total]) => (
                  <span
                    key={label}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300"
                  >
                    {label}: <strong className="text-white">{formatNumber(total)}</strong>
                  </span>
                )
              )}
            </div>
          </div>
        </>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#101a2b]">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <h2 className="font-semibold text-white">Flow Predictions</h2>

          <select
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <option value="all">All Traffic</option>
            <option value="true">Suspicious Only</option>
            <option value="false">Benign Only</option>
          </select>
        </div>

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
                    {["Flow #", "Classification", "Confidence", "Status"].map(
                      (heading) => (
                        <th key={heading} className="px-5 py-4">{heading}</th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {results.map((result) => (
                    <tr key={result.id} className="border-t border-slate-800">
                      <td className="px-5 py-4 text-slate-400">
                        {result.flow_index}
                      </td>
                      <td className="px-5 py-4 text-white">
                        {result.predicted_label}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {formatConfidence(result.confidence)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge suspicious={result.is_suspicious} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {results.length === 0 && (
                <p className="p-8 text-center text-slate-500">
                  No matching records.
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
