
export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "cyan",
  subtitle,
}) {
  const colors = {
    cyan: "bg-cyan-500/10 text-cyan-400",
    green: "bg-emerald-500/10 text-emerald-400",
    red: "bg-red-500/10 text-red-400",
    purple: "bg-violet-500/10 text-violet-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#101a2b] p-5 transition hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className={`rounded-xl p-3 ${colors[color]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-4 text-xs text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
