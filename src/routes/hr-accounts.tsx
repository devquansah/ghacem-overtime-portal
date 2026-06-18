import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useOvertime } from "@/lib/overtime/store";
import { ActiveDirectoryLogin, type UserSession } from "@/components/overtime/ActiveDirectoryLogin";
import { AdminHeader } from "@/components/overtime/AdminHeader";
import { HRDashboard } from "@/components/overtime/HRDashboard";
import { PayrollDashboard } from "@/components/overtime/PayrollDashboard";
import { ManagementDashboard } from "@/components/overtime/ManagementDashboard";

export const Route = createFileRoute("/hr-accounts")({
  head: () => ({
    meta: [
      { title: "HR & Accounts Portal | Overtime Portal" },
      { name: "description", content: "Audit compliance ledger, payroll summary, and executive KPIs." }
    ]
  }),
  component: HRAccountsPortalComponent
});

function HRAccountsPortalComponent() {
  const { resetAllData } = useOvertime();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [hrSubTab, setHrSubTab] = useState<"audit" | "payroll" | "kpis">("audit");

  useEffect(() => {
    const stored = localStorage.getItem("overtime_hr_session");
    if (stored) {
      setSession(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("overtime_hr_session");
    setSession(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading session...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans">
      <AdminHeader
        activeTab="hr_accounts"
        session={session}
        onLogout={handleLogout}
        onReset={resetAllData}
      />

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {!session ? (
          <ActiveDirectoryLogin role="HR" onLoginSuccess={setSession} />
        ) : (
          <div className="space-y-6">
            
            {/* HR Sub-Navigation Bar */}
            <div className="bg-white border border-zinc-200 py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-between flex-wrap gap-4 text-left">
              <div className="flex gap-2">
                <button
                  onClick={() => setHrSubTab("audit")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    hrSubTab === "audit"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  HR Audit Log
                </button>
                <button
                  onClick={() => setHrSubTab("payroll")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    hrSubTab === "payroll"
                      ? "bg-purple-700 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  Payroll Summary
                </button>
                <button
                  onClick={() => setHrSubTab("kpis")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    hrSubTab === "kpis"
                      ? "bg-zinc-700 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  Executive KPIs
                </button>
              </div>
              
              <div className="text-xs text-zinc-500 font-medium">
                Active operator: <span className="font-extrabold text-zinc-800">{session.name}</span>
              </div>
            </div>

            {/* Render Selected Sub-View */}
            <div className="transition-all duration-200">
              {hrSubTab === "audit" && <HRDashboard />}
              {hrSubTab === "payroll" && <PayrollDashboard />}
              {hrSubTab === "kpis" && <ManagementDashboard />}
            </div>

          </div>
        )}
      </main>

      <footer className="bg-zinc-900 border-t border-zinc-800 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4">
          <p>© 2026 Overtime Portal — Operations Portal. Developed for Overtime & Workforce Analytics.</p>
        </div>
      </footer>
    </div>
  );
}
