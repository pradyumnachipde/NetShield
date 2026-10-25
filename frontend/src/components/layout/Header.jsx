
import { useEffect, useState } from "react";
import { Menu, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { healthAPI } from "../../services/api";

export default function Header({ onMenuClick }) {
  const [connected, setConnected] = useState(null);

  useEffect(() => {
    let active = true;

    const checkConnection = async () => {
      try {
        await healthAPI.check();
        if (active) setConnected(true);
      } catch {
        if (active) setConnected(false);
      }
    };

    checkConnection();

    const interval = setInterval(checkConnection, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800 bg-[#080d18]/95 px-5 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-slate-400 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>

        <div>
          <h2 className="text-sm font-semibold text-white sm:text-base">
            Security Operations Center
          </h2>
          <p className="hidden text-xs text-slate-500 sm:block">
            Network Traffic Intelligence Platform
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${
            connected === true
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : connected === false
              ? "border-red-500/20 bg-red-500/10 text-red-400"
              : "border-slate-700 bg-slate-800 text-slate-400"
          }`}
        >
          {connected === true ? (
            <Wifi size={14} />
          ) : (
            <WifiOff size={14} />
          )}

          <span className="hidden sm:inline">
            {connected === true
              ? "API Connected"
              : connected === false
              ? "API Offline"
              : "Connecting"}
          </span>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-cyan-400">
          <ShieldCheck size={19} />
        </div>
      </div>
    </header>
  );
}
