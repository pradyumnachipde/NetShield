
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History as HistoryIcon, ArrowRight } from "lucide-react";

import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import { detectionAPI } from "../services/api";
import { formatDate, formatNumber, getApiError } from "../utils/formatters";

export default function History() {
  const [uploads, setUploads] = useState([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        const response = await detectionAPI.getHistory({
          page,
          page_size: 20,
        });

        if (active) {
          setUploads(response.data.results);
          setCount(response.data.count);
        }
      } catch (err) {
        if (active) setError(getApiError(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, [page]);

  return (
    <div>
      <PageHeader
        title="Upload History"
        description="Browse previously analyzed network-flow datasets."
      />

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#101a2b]">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <p className="p-6 text-red-400">{error}</p>
        ) : uploads.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-slate-500">
            <HistoryIcon size={40} className="mb-4" />
            <p>No analyses found.</p>
            <Link to="/analyze" className="mt-3 text-cyan-400">
              Upload your first CSV
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/70 text-xs uppercase text-slate-500">
                  <tr>
                    {["Filename", "Uploaded", "Total Flows", "Suspicious", "Action"].map(
                      (heading) => (
                        <th key={heading} className="px-5 py-4">
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {uploads.map((upload) => (
                    <tr
                      key={upload.id}
                      className="border-t border-slate-800 text-slate-300 hover:bg-slate-800/30"
                    >
                      <td className="max-w-64 truncate px-5 py-4 font-medium text-white">
                        {upload.filename}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {formatDate(upload.uploaded_at)}
                      </td>
                      <td className="px-5 py-4">
                        {formatNumber(upload.total_flows)}
                      </td>
                      <td className="px-5 py-4 text-red-400">
                        {formatNumber(upload.suspicious_flows)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/history/${upload.id}`}
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                        >
                          Details <ArrowRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              count={count}
              pageSize={20}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
