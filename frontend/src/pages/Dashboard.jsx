
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Database,
  ArrowRight,
  UploadCloud,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import TrafficChart from "../components/TrafficChart";
import LoadingState from "../components/LoadingState";
import { analyticsAPI } from "../services/api";
import {
  formatNumber,
  formatDate,
  getApiError,
} from "../utils/formatters";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [classifications, setClassifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [dashboardResponse, classificationResponse] =
          await Promise.all([
            analyticsAPI.getDashboard(),
            analyticsAPI.getClassifications(),
          ]);

        if (active) {
          setStats(dashboardResponse.data);
          setClassifications(
            classificationResponse.data.classifications
          );
        }
      } catch (err) {
        if (active) setError(getApiError(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => { active = false; };
  }, []);

  return (
    <div>
      <PageHeader
        title="Security Dashboard"
        description="Overview of analyzed network traffic and intrusion detections."
        action={
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            <UploadCloud size={18} />
            Analyze Traffic
          </Link>
        }
      />

      {error && (
        <p className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Network Flows"
          value={loading ? "..." : formatNumber(stats?.total_flows)}
          icon={Activity}
        />
        <StatCard
          title="Benign Traffic"
          value={loading ? "..." : formatNumber(stats?.benign_flows)}
          icon={ShieldCheck}
          color="green"
        />
        <StatCard
          title="Suspicious Traffic"
          value={loading ? "..." : formatNumber(stats?.suspicious_flows)}
          icon={ShieldAlert}
          color="red"
        />
        <StatCard
          title="Total Analyses"
          value={loading ? "..." : formatNumber(stats?.total_uploads)}
          icon={Database}
          color="purple"
        />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-[#101a2b] p-6 xl:col-span-2">
          <h2 className="mb-5 text-lg font-semibold text-white">
            Traffic Classification Distribution
          </h2>

          {loading ? (
            <LoadingState />
          ) : (
            <TrafficChart classifications={classifications} />
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#101a2b] p-6">
          <h2 className="text-lg font-semibold text-white">
            Threat Overview
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Percentage of analyzed flows classified as suspicious.
          </p>

          <div className="flex min-h-64 flex-col items-center justify-center">
            <span className="text-5xl font-bold text-red-400">
              {loading ? "..." : `${stats?.suspicious_percentage ?? 0}%`}
            </span>
            <p className="mt-3 text-sm text-slate-500">
              Suspicious Flow Rate
            </p>
          </div>

          <p className="rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-400">
            Model predictions may contain false positives and false negatives.
          </p>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-slate-800 bg-[#101a2b] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Recent Analyses
          </h2>

          <Link
            to="/history"
            className="flex items-center gap-1 text-sm text-cyan-400"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {!stats?.recent_uploads?.length ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No analyses available yet.
          </p>
        ) : (
          <div className="space-y-3">
            {stats.recent_uploads.map((upload) => (
              <Link
                key={upload.id}
                to={`/history/${upload.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-cyan-500/30"
              >
                <div>
                  <p className="font-medium text-white">{upload.filename}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(upload.uploaded_at)} · {formatNumber(upload.total_flows)} flows
                  </p>
                </div>

                <span className="text-sm text-red-400">
                  {formatNumber(upload.suspicious_flows)} suspicious
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
