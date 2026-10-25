
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import { analyticsAPI } from "../services/api";
import { getApiError } from "../utils/formatters";

export default function ModelAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadMetrics() {
      try {
        const response = await analyticsAPI.getModelMetrics();
        if (active) setMetrics(response.data);
      } catch (err) {
        if (active) setError(getApiError(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMetrics();
    return () => { active = false; };
  }, []);

  const summary = metrics
    ? [
        { name: "Accuracy", value: metrics.accuracy },
        { name: "Balanced Accuracy", value: metrics.balanced_accuracy },
        { name: "Precision", value: metrics.weighted_precision },
        { name: "Recall", value: metrics.weighted_recall },
        { name: "F1 Score", value: metrics.weighted_f1_score },
      ]
    : [];

  const classMetrics = metrics
    ? metrics.class_names.map((name) => ({
        name,
        precision: metrics.classification_report[name]?.precision ?? 0,
        recall: metrics.classification_report[name]?.recall ?? 0,
        f1: metrics.classification_report[name]?.["f1-score"] ?? 0,
        support: metrics.classification_report[name]?.support ?? 0,
      }))
    : [];

  return (
    <div>
      <PageHeader
        title="Model Analytics"
        description="Evaluation metrics for the trained MLP intrusion detection model."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-red-400">
          {error}
        </p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {summary.map((metric) => (
              <div
                key={metric.name}
                className="rounded-xl border border-slate-800 bg-[#101a2b] p-5"
              >
                <p className="text-xs text-slate-400">{metric.name}</p>
                <p className="mt-3 text-2xl font-bold text-cyan-400">
                  {(metric.value * 100).toFixed(2)}%
                </p>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-2xl border border-slate-800 bg-[#101a2b] p-6">
            <h2 className="mb-5 text-lg font-semibold text-white">
              Per-Class Performance
            </h2>

            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classMetrics}
                  margin={{ bottom: 70, left: 5, right: 15 }}
                >
                  <CartesianGrid stroke="#253247" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={100}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#94a3b8" domain={[0, 1]} />
                  <Tooltip
                    contentStyle={{
                      background: "#101a2b",
                      border: "1px solid #334155",
                    }}
                  />
                  <Bar dataKey="precision" fill="#22d3ee" name="Precision" />
                  <Bar dataKey="recall" fill="#a78bfa" name="Recall" />
                  <Bar dataKey="f1" fill="#34d399" name="F1 Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-7 overflow-hidden rounded-2xl border border-slate-800 bg-[#101a2b]">
            <h2 className="p-6 text-lg font-semibold text-white">
              Classification Report
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/70 text-xs uppercase text-slate-500">
                  <tr>
                    {["Class", "Precision", "Recall", "F1 Score", "Support"].map(
                      (heading) => (
                        <th key={heading} className="px-5 py-4">{heading}</th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {classMetrics.map((item) => (
                    <tr key={item.name} className="border-t border-slate-800">
                      <td className="px-5 py-4 text-white">{item.name}</td>
                      <td className="px-5 py-4">{item.precision.toFixed(3)}</td>
                      <td className="px-5 py-4">{item.recall.toFixed(3)}</td>
                      <td className="px-5 py-4">{item.f1.toFixed(3)}</td>
                      <td className="px-5 py-4">{item.support.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            Evaluation uses a held-out random flow-level split of CIC-IDS2017.
            Related traffic flows may occur across splits, so these metrics
            may overestimate performance on unseen networks.
          </p>
        </>
      )}
    </div>
  );
}
