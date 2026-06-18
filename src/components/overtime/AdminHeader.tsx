import React from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Landmark, LogOut, RefreshCw, ArrowLeft } from "lucide-react";

interface AdminHeaderProps {
  activeTab: "supervisor" | "hr_accounts";
  session: { name: string; role: string } | null;
  onLogout: () => void;
  onReset: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  session,
  onLogout,
  onReset
}) => {
  return (
    <header className="bg-zinc-900 border-b border-zinc-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
        
        {/* Brand Logo & Tabs */}
        <div className="flex items-center gap-6 select-none flex-wrap">
          <h1 className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 uppercase">
            OVERTIME PORTAL
          </h1>
          
          {/* TAB LINKS */}
          <nav className="flex gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <Link
              to="/supervisor"
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "supervisor"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Supervisor Portal
            </Link>
            <Link
              to="/hr-accounts"
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "hr_accounts"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Landmark className="h-3.5 w-3.5" />
              HR & Accounts Portal
            </Link>
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          
          {/* Link to Employee Portal */}
          <Link
            to="/"
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-750 text-xs font-bold text-zinc-300 rounded-lg hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Public Portal
          </Link>

          {/* User profile & Logout */}
          {session && (
            <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
              <div className="text-right flex flex-col justify-center">
                <span className="text-xs font-extrabold text-zinc-100 leading-tight block">
                  {session.name}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-wider ${
                  activeTab === "supervisor" ? "text-orange-400" : "text-indigo-400"
                }`}>
                  {session.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Logout Session"
                className="p-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Reset button */}
          <button
            onClick={onReset}
            title="Reset Mock Data"
            className="p-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

        </div>

      </div>
    </header>
  );
};
