
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  UploadCloud,
  FileSpreadsheet,
  ShieldCheck,
  ShieldAlert,
  Activity,
  CheckCircle2,
  X,
  ArrowRight,
  Info,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { detectionAPI } from "../services/api";
import { formatNumber, getApiError } from "../utils/formatters";

const MAX_SIZE = 20 * 1024 * 1024;

export default function Analyze() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const selectFile = (selected) => {
    setError("");
    setResult(null);

    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }

    if (selected.size > MAX_SIZE) {
      setError("Maximum allowed file size is 20 MB.");
      return;
    }

    setFile(selected);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file || loading) return;

    setLoading(true);
    setError("");
    setProgress(0);
    setResult(null);

    try {
      const response = await detectionAPI.upload(file, (event) => {
        if (event.total) {
          setProgress(
            Math.round((event.loaded * 100) / event.total)
          );
        }
      });

      setResult(response.data);
      setFile(null);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Analyze Network Traffic"
        description="Upload CICFlowMeter-compatible CSV records for neural network classification."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-slate-800 bg-[#101a2b] p-6">
            <h2 className="mb-2 text-lg font-semibold text-white">
              Upload Flow Records
            </h2>

            <p className="mb-6 text-sm text-slate-400">
              Select a CSV file containing the network-flow features used
              during model training.
            </p>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`relative flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                dragging
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-slate-700 bg-slate-900/40 hover:border-cyan-500/50"
              }`}
            >
              <UploadCloud size={44} className="mb-4 text-cyan-400" />

              <h3 className="font-semibold text-white">
                Drag and drop your CSV file
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                or choose a file from your computer
              </p>

              <label className="mt-5 cursor-pointer rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
                Browse Files
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  disabled={loading}
                  onChange={(event) => {
                    selectFile(event.target.files[0]);
                    event.target.value = "";
                  }}
                />
              </label>

              <p className="mt-4 text-xs text-slate-500">
                CSV only · Maximum 20 MB · Maximum 10,000 flows
              </p>
            </div>

            {file && (
              <div className="mt-5 flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileSpreadsheet className="shrink-0 text-cyan-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <button
                  disabled={loading}
                  onClick={() => setFile(null)}
                  className="text-slate-400 hover:text-white"
                  aria-label="Remove file"
                >
                  <X size={19} />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {loading && (
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs text-slate-400">
                  <span>
                    {progress === 100
                      ? "Upload complete — analyzing flows..."
                      : "Uploading file..."}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40"
            >
              <Activity size={19} />
              {loading ? "Analyzing Traffic..." : "Start Analysis"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#101a2b] p-6">
          <h2 className="mb-5 flex items-center gap-2 font-semibold text-white">
            <Info size={18} className="text-cyan-400" />
            Analysis Information
          </h2>

          <div className="space-y-5 text-sm">
            <div>
              <p className="font-medium text-white">Detection Model</p>
              <p className="mt-1 text-slate-400">
                Multilayer Perceptron (MLP)
              </p>
            </div>

            <div>
              <p className="font-medium text-white">Dataset</p>
              <p className="mt-1 text-slate-400">CIC-IDS2017</p>
            </div>

            <div>
              <p className="font-medium text-white">Analysis Mode</p>
              <p className="mt-1 text-slate-400">
                Offline, supervised flow classification
              </p>
            </div>

            <div className="border-t border-slate-800 pt-5">
              <p className="text-xs leading-relaxed text-slate-500">
                NetShield analyzes uploaded flow features, not raw
                packets. Results are model predictions and may contain
                false positives or false negatives.
              </p>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
            <CheckCircle2 size={22} />
            <div>
              <p className="font-semibold">Analysis Completed</p>
              <p className="text-sm opacity-80">
                {result.filename} processed successfully.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <StatCard
              title="Total Flows"
              value={formatNumber(result.total_flows)}
              icon={Activity}
            />
            <StatCard
              title="Benign Flows"
              value={formatNumber(result.benign_flows)}
              icon={ShieldCheck}
              color="green"
            />
            <StatCard
              title="Suspicious Flows"
              value={formatNumber(result.suspicious_flows)}
              icon={ShieldAlert}
              color="red"
            />
          </div>

          <Link
            to={`/history/${result.upload_id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
          >
            View Detailed Results
            <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </div>
  );
}
