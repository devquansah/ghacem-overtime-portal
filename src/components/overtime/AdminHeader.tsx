import React from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Landmark, LogOut, RefreshCw, ArrowLeft } from "lucide-react";
import logoUrl from "@/assets/logo.png";

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
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 select-none">
          <img src={logoUrl} alt="Heidelberg Materials Logo" className="h-8 object-contain" />
          <h1 className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase">
            OVERTIME PORTAL
            {activeTab === "supervisor" && (
              <span className="text-yellow-400 text-xs font-bold font-sans tracking-normal normal-case ml-2.5">
                | Supervisor Portal
              </span>
            )}
            {activeTab === "hr_accounts" && (
              <span className="text-yellow-400 text-xs font-bold font-sans tracking-normal normal-case ml-2.5">
                | HR & Accounts Portal
              </span>
            )}
          </h1>
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
                <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400">
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
