
import { NavLink } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  UploadCloud,
  History,
  TriangleAlert,
  Activity,
  GitBranch,
  X,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Analyze Traffic",
    path: "/analyze",
    icon: UploadCloud,
  },
  {
    name: "Upload History",
    path: "/history",
    icon: History,
  },
  {
    name: "Security Alerts",
    path: "/alerts",
    icon: TriangleAlert,
  },
  {
    name: "Model Analytics",
    path: "/model",
    icon: Activity,
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-[#0c1423] transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/15 p-2.5 text-cyan-400">
              <Shield size={26} strokeWidth={2.5} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Net<span className="text-cyan-400">Shield</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                Intrusion Detection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-600">
            Workspace
          </p>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                    }`
                  }
                >
                  <Icon size={19} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto space-y-4 p-5">
          <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-cyan-400">
              <Shield size={16} />
              <span className="text-xs font-semibold">
                Offline Flow Analysis
              </span>
            </div>

            <p className="text-xs leading-relaxed text-slate-400">
              ML-powered classification of uploaded network-flow records.
            </p>
          </div>

          <a
            href="https://github.com/pradyumnachipde/NetShield"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2 text-xs text-slate-500 transition hover:text-cyan-400"
          >
            <GitBranch size={15} />
            View on GitHub
          </a>
        </div>
      </aside>
    </>
  );
}
