import React, { useState } from "react";

export interface UserSession {
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

interface ActiveDirectoryLoginProps {
  role: "Supervisor" | "HR";
  onLoginSuccess: (session: UserSession) => void;
}

export const ActiveDirectoryLogin: React.FC<ActiveDirectoryLoginProps> = ({
  role,
  onLoginSuccess
}) => {
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
      const sess: UserSession = { email: expectedEmail, name: expectedName, role };
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
};
