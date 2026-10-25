
export default function StatusBadge({ suspicious = false, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        suspicious
          ? "bg-red-500/10 text-red-400"
          : "bg-emerald-500/10 text-emerald-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          suspicious ? "bg-red-400" : "bg-emerald-400"
        }`}
      />
      {label || (suspicious ? "Suspicious" : "Benign")}
    </span>
  );
}
