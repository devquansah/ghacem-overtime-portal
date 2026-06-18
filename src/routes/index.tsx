import { createFileRoute } from "@tanstack/react-router";
import { RequestForm } from "@/components/overtime/RequestForm";
import { RefreshCw } from "lucide-react";
import { useOvertime } from "@/lib/overtime/store";
import logoUrl from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Employee Overtime Form | Ghacem Overtime Portal" },
      { name: "description", content: "Submit employee overtime hours sheets." }
    ]
  }),
  component: EmployeePortalComponent
});

function EmployeePortalComponent() {
  const { resetAllData } = useOvertime();

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans">
      
      {/* Public Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 select-none">
            <img src={logoUrl} alt="Heidelberg Materials Logo" className="h-8 object-contain" />
            <h1 className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase">
              OVERTIME PORTAL <span className="text-zinc-400 text-xs font-bold font-sans tracking-normal normal-case ml-2.5">| Employee Form</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetAllData}
              title="Reset Mock Data"
              className="p-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Form content */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        <RequestForm />
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4">
          <p>© 2026 Overtime Portal — Operations Portal. Developed for Overtime & Workforce Analytics.</p>
        </div>
      </footer>

    </div>
  );
}
