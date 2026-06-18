import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Clock, ShieldCheck, CheckSquare, LayoutDashboard, Building2, User, RefreshCw, LogOut, Key, ArrowLeft, FileText, Landmark
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { OvertimeProvider, useOvertime } from "@/lib/overtime/store";
import { RequestForm } from "@/components/overtime/RequestForm";
import { ApprovalCenter } from "@/components/overtime/ApprovalCenter";
import { HRDashboard } from "@/components/overtime/HRDashboard";
import { PayrollDashboard } from "@/components/overtime/PayrollDashboard";
import { ManagementDashboard } from "@/components/overtime/ManagementDashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overtime Portal" },
      { name: "description", content: "Interactive portal for employee overtime request submission, supervisor approval routing, HR auditing, and payroll summaries." },
    ],
  }),
  component: () => (
    <OvertimeProvider>
      <AppLayout />
      <Toaster richColors position="top-right" />
    </OvertimeProvider>
  ),
});

type PortalMode = "landing" | "employee" | "supervisor" | "hr_accounts";
type UserRole = "Employee" | "Supervisor" | "HR" | "Payroll" | "Executive";

interface UserSession {
  email: string;
  name: string;
  role: "Supervisor" | "HR";
}

function MicrosoftADLogo() {
  return (
    <div className="grid grid-cols-2 gap-0.5 w-5 h-5 flex-shrink-0">
      <div className="bg-[#f25f22] w-2.5 h-2.5"></div>
      <div className="bg-[#7fba00] w-2.5 h-2.5"></div>
      <div className="bg-[#00a4ef] w-2.5 h-2.5"></div>
      <div className="bg-[#ffb900] w-2.5 h-2.5"></div>
    </div>
  );
}

function ActiveDirectoryLogin({ 
  role, 
  onLoginSuccess 
}: { 
  role: "Supervisor" | "HR"; 
  onLoginSuccess: (session: UserSession) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const expectedEmail = role === "Supervisor" ? "s.hanson@company.com" : "e.asare@company.com";
  const expectedPassword = "WindowsPassword123!";
  const expectedName = role === "Supervisor" ? "Sarah Hanson" : "Efua Asare";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (email.trim().toLowerCase() === expectedEmail && password === expectedPassword) {
      const sess = { email: expectedEmail, name: expectedName, role };
      const storageKey = role === "Supervisor" ? "overtime_supervisor_session" : "overtime_hr_session";
      localStorage.setItem(storageKey, JSON.stringify(sess));
      onLoginSuccess(sess);
    } else {
      setError(`We couldn't find an account matching that email or password. Please use ${expectedEmail} and password ${expectedPassword}`);
    }
  };

  const handleFill = () => {
    setEmail(expectedEmail);
    setPassword(expectedPassword);
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-zinc-200 shadow-xl rounded-md p-9 text-left font-sans text-zinc-700 my-16">
      <div className="flex items-center gap-2 mb-6">
        <MicrosoftADLogo />
        <span className="text-zinc-500 font-semibold text-sm">Microsoft</span>
      </div>

      <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Sign in</h2>
      <p className="text-xs text-zinc-500 mt-1">Use your company account and Windows Active Directory credentials to access the {role === "Supervisor" ? "Supervisor approvals queue" : "HR & Accounts ledger"}.</p>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded leading-relaxed">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-9 border border-zinc-300 rounded-none px-3 text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8]"
            placeholder={`Company Email (e.g. ${expectedEmail})`}
            required
          />
        </div>

        <div className="space-y-1">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-9 border border-zinc-300 rounded-none px-3 text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8]"
            placeholder="Windows Password"
            required
          />
        </div>

        <div className="flex justify-between items-center text-xs text-[#0067b8] select-none pt-1">
          <span className="hover:underline cursor-pointer">Can’t access your account?</span>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleFill}
            className="px-4 h-9 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Autofill AD
          </button>
          <button
            type="submit"
            className="px-6 h-9 bg-[#0067b8] hover:bg-[#005da6] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
}

function AppLayout() {
  const [portalMode, setPortalMode] = useState<PortalMode>("landing");

  const [supervisorSession, setSupervisorSession] = useState<UserSession | null>(() => {
    const stored = localStorage.getItem("overtime_supervisor_session");
    return stored ? JSON.parse(stored) : null;
  });

  const [hrSession, setHrSession] = useState<UserSession | null>(() => {
    const stored = localStorage.getItem("overtime_hr_session");
    return stored ? JSON.parse(stored) : null;
  });

  const [hrSubTab, setHrSubTab] = useState<"audit" | "payroll" | "kpis">("audit");
  const { resetAllData } = useOvertime();

  const handleLogout = (role: "Supervisor" | "HR") => {
    if (role === "Supervisor") {
      localStorage.removeItem("overtime_supervisor_session");
      setSupervisorSession(null);
    } else {
      localStorage.removeItem("overtime_hr_session");
      setHrSession(null);
    }
  };

  // 1. LANDING DIRECTORY RENDER
  if (portalMode === "landing") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
        
        {/* Brand Header */}
        <header className="bg-zinc-900 border-b border-zinc-800 py-6 text-center shadow-md">
          <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 uppercase">
            Overtime Portal
          </h1>
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">
            Workforce operations directory & secure panels
          </p>
        </header>

        {/* Directory Selection Cards */}
        <main className="flex-1 max-w-6xl mx-auto px-6 py-16 flex flex-col justify-center items-center w-full">
          <div className="text-center max-w-xl mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-100">Select Access Portal</h2>
            <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
              Authenticate into your respective administrative workspace below, or access the employee worksheet to submit new logs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            
            {/* Card 1: Employee Form */}
            <div 
              onClick={() => setPortalMode("employee")}
              className="bg-zinc-900 border border-zinc-800 hover:border-emerald-600/50 rounded-2xl p-6 text-left flex flex-col justify-between hover:-translate-y-1 transition-all cursor-pointer shadow-lg group select-none"
            >
              <div>
                <div className="bg-emerald-950/60 border border-emerald-900/50 text-emerald-400 p-3 rounded-xl w-fit mb-5 transition-transform group-hover:scale-105">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-150 group-hover:text-emerald-400 transition-colors">Employee Portal</h3>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  Open worksheet to submit new overtime hours. Free-form manual input for ID, name, job title, department, supervisor, and shifts. Exempt from credentials.
                </p>
              </div>
              <button className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow mt-8 cursor-pointer transition-colors">
                Submit Overtime
              </button>
            </div>

            {/* Card 2: Supervisor approvals */}
            <div 
              onClick={() => setPortalMode("supervisor")}
              className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 rounded-2xl p-6 text-left flex flex-col justify-between hover:-translate-y-1 transition-all cursor-pointer shadow-lg group select-none"
            >
              <div>
                <div className="bg-orange-950/60 border border-orange-900/50 text-orange-400 p-3 rounded-xl w-fit mb-5 transition-transform group-hover:scale-105">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-150 group-hover:text-orange-400 transition-colors">Supervisor Portal</h3>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  Evaluate, review, and comment on pending logs. Secure sign-in required using corporate company email and Windows Active Directory credentials.
                </p>
              </div>
              <button className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow mt-8 cursor-pointer transition-colors">
                Review Approvals
              </button>
            </div>

            {/* Card 3: HR & Accounts */}
            <div 
              onClick={() => setPortalMode("hr_accounts")}
              className="bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-2xl p-6 text-left flex flex-col justify-between hover:-translate-y-1 transition-all cursor-pointer shadow-lg group select-none"
            >
              <div>
                <div className="bg-indigo-950/60 border border-indigo-900/50 text-indigo-400 p-3 rounded-xl w-fit mb-5 transition-transform group-hover:scale-105">
                  <Landmark className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-150 group-hover:text-indigo-400 transition-colors">HR & Accounts Portal</h3>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  Audit compliant logs, compile monthly payroll rates, and track executive KPIs. Secure sign-in required using company email and Windows credentials.
                </p>
              </div>
              <button className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow mt-8 cursor-pointer transition-colors">
                Audit & Payroll
              </button>
            </div>

          </div>
        </main>

        <footer className="bg-zinc-900 border-t border-zinc-850 py-6 text-center text-xs text-zinc-600">
          <p>© 2026 Overtime Portal — Secure administrative dashboard directory.</p>
        </footer>

      </div>
    );
  }

  // 2. ISOLATED PORTAL INTERFACES
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans">
      
      {/* BRAND HEADER */}
      <header className="bg-zinc-900 border-b border-zinc-800 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 select-none">
            <div>
              <h1 className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 uppercase">
                OVERTIME PORTAL 
                {portalMode === "employee" && <span className="text-zinc-400 text-xs font-bold font-sans tracking-normal normal-case ml-2.5">| Employee Form</span>}
                {portalMode === "supervisor" && <span className="text-orange-400 text-xs font-bold font-sans tracking-normal normal-case ml-2.5">| Supervisor Approvals</span>}
                {portalMode === "hr_accounts" && <span className="text-indigo-400 text-xs font-bold font-sans tracking-normal normal-case ml-2.5">| HR & Accounts Ledger</span>}
              </h1>
            </div>
          </div>

          {/* RIGHT SIDE PROFILE & ACTION BUTTONS */}
          <div className="flex items-center gap-3">
            
            {/* Back to Home Button */}
            <button
              onClick={() => setPortalMode("landing")}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-750 text-xs font-bold text-zinc-300 rounded-lg hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Portals
            </button>

            {/* Supervisor Session Info & Logout */}
            {portalMode === "supervisor" && supervisorSession && (
              <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
                <div className="text-right flex flex-col justify-center">
                  <span className="text-xs font-extrabold text-zinc-100 leading-tight block">
                    {supervisorSession.name}
                  </span>
                  <span className="text-[9px] font-black uppercase text-orange-400 tracking-wider">
                    {supervisorSession.role}
                  </span>
                </div>
                <button
                  onClick={() => handleLogout("Supervisor")}
                  title="Logout Session"
                  className="p-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* HR Session Info & Logout */}
            {portalMode === "hr_accounts" && hrSession && (
              <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
                <div className="text-right flex flex-col justify-center">
                  <span className="text-xs font-extrabold text-zinc-100 leading-tight block">
                    {hrSession.name}
                  </span>
                  <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">
                    HR & Accounts
                  </span>
                </div>
                <button
                  onClick={() => handleLogout("HR")}
                  title="Logout Session"
                  className="p-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

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

      {/* VIEW PANEL CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        
        {/* Employee Portal */}
        {portalMode === "employee" && <RequestForm />}

        {/* Supervisor approvals Portal */}
        {portalMode === "supervisor" && (
          !supervisorSession ? (
            <ActiveDirectoryLogin role="Supervisor" onLoginSuccess={setSupervisorSession} />
          ) : (
            <ApprovalCenter />
          )
        )}

        {/* HR & Accounts Portal */}
        {portalMode === "hr_accounts" && (
          !hrSession ? (
            <ActiveDirectoryLogin role="HR" onLoginSuccess={setHrSession} />
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
                  Active operator: <span className="font-extrabold text-zinc-800">{hrSession.name}</span>
                </div>
              </div>

              {/* Render Selected Sub-View */}
              <div className="transition-all duration-200">
                {hrSubTab === "audit" && <HRDashboard />}
                {hrSubTab === "payroll" && <PayrollDashboard />}
                {hrSubTab === "kpis" && <ManagementDashboard />}
              </div>

            </div>
          )
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4">
          <p>© 2026 Overtime Portal — Operations Portal. Developed for Overtime & Workforce Analytics.</p>
        </div>
      </footer>

    </div>
  );
}
