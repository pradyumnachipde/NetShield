
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080d18]">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:ml-64">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="mx-auto max-w-[1600px] px-5 py-8 md:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-slate-800 px-8 py-5 text-center text-xs text-slate-600">
          NetShield — Neural Network-Based Intrusion Detection
          <span className="mx-2">•</span>
          Offline Network Flow Analysis
        </footer>
      </div>
    </div>
  );
}
