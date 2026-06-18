import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useOvertime } from "@/lib/overtime/store";
import { ActiveDirectoryLogin, type UserSession } from "@/components/overtime/ActiveDirectoryLogin";
import { AdminHeader } from "@/components/overtime/AdminHeader";
import { ApprovalCenter } from "@/components/overtime/ApprovalCenter";

export const Route = createFileRoute("/supervisor")({
  head: () => ({
    meta: [
      { title: "Supervisor Portal | Overtime Portal" },
      { name: "description", content: "Review and approve employee overtime requests." }
    ]
  }),
  component: SupervisorPortalComponent
});

function SupervisorPortalComponent() {
  const { resetAllData } = useOvertime();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("overtime_supervisor_session");
    if (stored) {
      setSession(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("overtime_supervisor_session");
    setSession(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading session...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans">
      <AdminHeader
        activeTab="supervisor"
        session={session}
        onLogout={handleLogout}
        onReset={resetAllData}
      />

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {!session ? (
          <ActiveDirectoryLogin role="Supervisor" onLoginSuccess={setSession} />
        ) : (
          <ApprovalCenter />
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
