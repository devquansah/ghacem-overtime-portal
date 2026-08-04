import React, { useState } from "react";
import { useOvertime, calculateRowHours } from "@/lib/overtime/store";
import { toast } from "sonner";
import { Plus, Trash2, Check, ClipboardList, Clock, CheckCircle2, XCircle, Banknote, ChevronDown, ChevronUp } from "lucide-react";

// ─── Time Options ─────────────────────────────────────────────────────────────
// 12-Hour AM/PM format options for Start Time
const START_TIME_OPTIONS_12H = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
});

// 24-Hour format options for Finish Time
const FINISH_TIME_OPTIONS_24H = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

// ─── Formatters ───────────────────────────────────────────────────────────────
export const formatDecimalToHMM = (decimalHours: number): string => {
  if (isNaN(decimalHours) || decimalHours <= 0) return "-";
  const totalMinutes = Math.round(decimalHours * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hrs}:${String(mins).padStart(2, "0")}`;
};

const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

// ─── Constants ────────────────────────────────────────────────────────────────
// Straight Day Worker columns
const STRAIGHT_DAY_TYPES = ["WEEKDAY", "WEEKEND", "PUBLIC HOLIDAY"] as const;
// Shift Worker columns
const SHIFT_WORKER_TYPES = ["REST DAY", "OFF DUTY", "P.HOL", "P.HOL OFF-DUTY"] as const;

const ALL_OVERTIME_TYPES = [
  "WEEKDAY",
  "WEEKEND",
  "PUBLIC HOLIDAY",
  "REST DAY",
  "OFF DUTY",
  "P.HOL",
  "P.HOL OFF-DUTY",
] as const;

type OvertimeType = typeof ALL_OVERTIME_TYPES[number];

// Multipliers per type
const MULTIPLIER_LABELS: Record<OvertimeType, string> = {
  "WEEKDAY": "150%",
  "WEEKEND": "200%",
  "PUBLIC HOLIDAY": "200%",
  "REST DAY": "150%",
  "OFF DUTY": "200%",
  "P.HOL": "200%",
  "P.HOL OFF-DUTY": "300%",
};

type OvertimeRow = {
  date: string;
  overtimeType: OvertimeType;
  startTime: string;
  endTime: string;
  actHours: number;
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    Pending: {
      color: "bg-yellow-50 text-yellow-700 border-yellow-300",
      icon: <Clock className="h-3 w-3" />,
      label: "Pending — Awaiting Approval",
    },
    Approved: {
      color: "bg-green-50 text-green-700 border-green-300",
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Approved",
    },
    Rejected: {
      color: "bg-red-50 text-red-700 border-red-300",
      icon: <XCircle className="h-3 w-3" />,
      label: "Rejected",
    },
    Paid: {
      color: "bg-blue-50 text-blue-700 border-blue-300",
      icon: <Banknote className="h-3 w-3" />,
      label: "Paid",
    },
  };
  const cfg = map[status] ?? map["Pending"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

// ─── Submission History Panel ─────────────────────────────────────────────────
const SubmissionHistory: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const { requests } = useOvertime();
  const [expanded, setExpanded] = useState<string | null>(null);

  const myRequests = requests
    .filter(r => r.employeeId.trim().toUpperCase() === employeeId.trim().toUpperCase())
    .sort((a, b) => b.dateCompleted.localeCompare(a.dateCompleted));

  if (!employeeId.trim() || myRequests.length === 0) return null;

  return (
    <div className="mt-10 border-t-2 border-dashed border-zinc-200 pt-6 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="h-4 w-4 text-yellow-600" />
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-800">
          My Submitted Requests
        </h3>
        <span className="ml-auto bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-300">
          {myRequests.length} record{myRequests.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {myRequests.map(req => (
          <div key={req.id} className="border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
            {/* Header row */}
            <button
              type="button"
              onClick={() => setExpanded(expanded === req.id ? null : req.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">
                  {req.id}
                </span>
                <span className="text-[11px] font-bold text-zinc-800">
                  Submitted: {formatDateDisplay(req.dateCompleted)}
                </span>
                <StatusBadge status={req.status} />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 shrink-0">
                <span className="font-bold">{formatDecimalToHMM(req.totalActHours)} hrs</span>
                {expanded === req.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
            </button>

            {/* Expanded detail */}
            {expanded === req.id && (
              <div className="border-t border-zinc-200 bg-white px-4 py-3 space-y-3 text-[11px]">
                {/* Progress Steps */}
                <div className="flex items-center gap-0">
                  {[
                    { label: "Submitted", done: true },
                    { label: "HOD Review", done: req.status !== "Pending" },
                    { label: "HR Approval", done: req.status === "Approved" || req.status === "Paid" },
                    { label: "Paid", done: req.status === "Paid" },
                  ].map((step, i, arr) => (
                    <React.Fragment key={step.label}>
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 font-extrabold text-[10px] ${
                          step.done
                            ? "bg-yellow-500 border-yellow-500 text-white"
                            : "bg-white border-zinc-300 text-zinc-400"
                        }`}>
                          {step.done ? <Check className="h-3 w-3" /> : i + 1}
                        </div>
                        <span className={`text-[9px] font-bold ${step.done ? "text-yellow-700" : "text-zinc-400"}`}>
                          {step.label}
                        </span>
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`flex-1 h-0.5 mb-4 ${step.done && arr[i + 1].done ? "bg-yellow-400" : "bg-zinc-200"}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                  <div className="space-y-0.5">
                    <span className="text-zinc-400 uppercase tracking-wider font-bold">Department</span>
                    <p className="font-semibold text-zinc-700">{req.department}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-zinc-400 uppercase tracking-wider font-bold">Type of Work</span>
                    <p className="font-semibold text-zinc-700">{req.jobTitle}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-zinc-400 uppercase tracking-wider font-bold">Total Est. Hours</span>
                    <p className="font-semibold text-zinc-700">{(req.totalEstHours ?? 0).toFixed(1)} hrs</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-zinc-400 uppercase tracking-wider font-bold">Total Act. Hours</span>
                    <p className="font-semibold text-zinc-700">{formatDecimalToHMM(req.totalActHours ?? 0)}</p>
                  </div>
                </div>

                {/* Comments/approval info */}
                {req.approvedBy && (
                  <div className="bg-green-50 border border-green-200 rounded px-3 py-2 text-[10px]">
                    <span className="font-bold text-green-700">Approved by: </span>
                    <span className="text-green-800">{req.approvedBy}</span>
                    {req.dateApproved && (
                      <span className="text-green-600"> on {formatDateDisplay(req.dateApproved)}</span>
                    )}
                    {req.comments && (
                      <p className="mt-1 text-green-700 italic">"{req.comments}"</p>
                    )}
                  </div>
                )}
                {req.status === "Rejected" && req.comments && (
                  <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-[10px]">
                    <span className="font-bold text-red-700">Reason: </span>
                    <span className="text-red-700 italic">{req.comments}</span>
                  </div>
                )}

                {/* Row breakdown */}
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border border-zinc-200 rounded">
                    <thead>
                      <tr className="bg-zinc-100 text-zinc-600 uppercase font-extrabold">
                        <th className="px-2 py-1 border-r text-left">Date</th>
                        <th className="px-2 py-1 border-r text-left">Type</th>
                        <th className="px-2 py-1 border-r text-center">Start</th>
                        <th className="px-2 py-1 border-r text-center">Finish</th>
                        <th className="px-2 py-1 text-center">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {req.rows.map((row, i) => (
                        <tr key={i} className="border-t border-zinc-100">
                          <td className="px-2 py-1 border-r">{formatDateDisplay(row.date)}</td>
                          <td className="px-2 py-1 border-r font-semibold text-yellow-700">{row.overtimeType}</td>
                          <td className="px-2 py-1 border-r text-center">{row.startTime}</td>
                          <td className="px-2 py-1 border-r text-center">{row.endTime}</td>
                          <td className="px-2 py-1 text-center font-bold">{formatDecimalToHMM(row.actHours ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Form ────────────────────────────────────────────────────────────────
export const RequestForm: React.FC = () => {
  const { employees, submitRequest } = useOvertime();

  // Employee fields
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [typeOfWork, setTypeOfWork] = useState("");        // renamed from jobTitle
  const [department, setDepartment] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [category, setCategory] = useState<"Senior Staff" | "Junior Staff" | "Contract Workers">("Senior Staff");
  const [dateCompleted, setDateCompleted] = useState(new Date().toISOString().split("T")[0]);

  // Timesheet rows
  const [rows, setRows] = useState<OvertimeRow[]>([
    { date: "", overtimeType: "WEEKDAY", startTime: "", endTime: "", actHours: 0 },
  ]);

  // Declaration & signature
  const [explanation, setExplanation] = useState("");
  const [signature, setSignature] = useState("");
  const [declaration, setDeclaration] = useState(false);

  // Show history for the current employee ID
  const [showHistory, setShowHistory] = useState(false);

  // Recalculate hours whenever start, end or type changes
  const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    if (field === "startTime" || field === "endTime" || field === "overtimeType") {
      const row = newRows[index];
      row.actHours = calculateRowHours(row.startTime, row.endTime, row.overtimeType);
    }
    setRows(newRows);
  };

  const addRow = () => setRows([...rows, { date: "", overtimeType: "WEEKDAY", startTime: "", endTime: "", actHours: 0 }]);
  const removeRow = (index: number) => { if (rows.length > 1) setRows(rows.filter((_, i) => i !== index)); };

  // Column totals per day type
  const colTotals = ALL_OVERTIME_TYPES.reduce((acc, typ) => {
    acc[typ] = rows.filter(r => r.overtimeType === typ).reduce((s, r) => s + r.actHours, 0);
    return acc;
  }, {} as Record<OvertimeType, number>);

  const totalActHours = rows.reduce((sum, r) => sum + r.actHours, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) { toast.error("Please enter an Employee ID."); return; }
    if (!employeeName.trim()) { toast.error("Please enter an Employee Name."); return; }
    if (!typeOfWork.trim()) { toast.error("Please enter the Type of Work."); return; }
    if (!department.trim()) { toast.error("Please enter a Department."); return; }
    if (!supervisor.trim()) { toast.error("Please enter the Immediate Supervisor."); return; }
    if (!declaration) { toast.error("Please check the declaration box before submitting."); return; }
    if (!signature) { toast.error("Please provide your Name Confirmation Signature."); return; }
    if (!explanation) { toast.error("Please describe the scope of work."); return; }
    const invalidRow = rows.some(r => !r.date || !r.overtimeType || !r.startTime || !r.endTime || r.actHours <= 0);
    if (invalidRow) { toast.error("Please fill all row fields. Calculated hours must be greater than 0."); return; }

    const matchedEmp = employees.find(e => e.id.trim().toUpperCase() === employeeId.trim().toUpperCase());
    const hourlyRate = matchedEmp ? matchedEmp.hourlyRate : 40.00;

    const storeRows = rows.map(r => ({
      estHours: r.actHours,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      overtimeType: r.overtimeType,
      actHours: r.actHours,
    }));

    const requestId = submitRequest({
      dateCompleted,
      employeeId: employeeId.trim(),
      employeeName: employeeName.trim(),
      jobTitle: typeOfWork.trim(),
      department: department.trim(),
      supervisor: supervisor.trim(),
      hourlyRate,
      category,
      rows: storeRows,
      totalEstHours: totalActHours,
      totalActHours,
      explanation,
      signature,
    });

    toast.success(`Request Submitted! ID: ${requestId} — Track it below ↓`);
    setShowHistory(true);

    // Reset form fields (keep employeeId so they can see history immediately)
    setEmployeeName("");
    setTypeOfWork("");
    setDepartment("");
    setSupervisor("");
    setCategory("Senior Staff");
    setRows([{ date: "", overtimeType: "WEEKDAY", startTime: "", endTime: "", actHours: 0 }]);
    setExplanation("");
    setSignature("");
    setDeclaration(false);
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 border border-zinc-200 shadow-xl rounded-md font-sans text-zinc-800">

      {/* ── Important Submission Rules ── */}
      <div className="bg-zinc-50 p-4 border-l-4 border-l-yellow-500 text-xs leading-relaxed space-y-1.5 text-zinc-700 rounded mb-8 font-medium text-left">
        <p className="font-bold text-yellow-600 text-sm mb-1">Important Submission Rules:</p>
        <p>1. No one would be paid for overtime unless this form has been completed.</p>
        <p>2. Overtime is paid only when forty hours have been done.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── SECTION 1: EMPLOYEE INFORMATION ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800 border-b-2 border-b-yellow-500 pb-1 text-left">
            1. Employee Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-600">Employee ID</label>
              <input
                type="text"
                value={employeeId}
                onChange={e => { setEmployeeId(e.target.value); setShowHistory(true); }}
                className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g. EMP001"
                required
              />
            </div>
            <div className="space-y-1.5 col-span-3">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Employee Name</label>
              <input
                type="text"
                value={employeeName}
                onChange={e => setEmployeeName(e.target.value)}
                className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* ← Job Title renamed to Type of Work */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Type of Work</label>
              <input
                type="text"
                value={typeOfWork}
                onChange={e => setTypeOfWork(e.target.value)}
                className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g. Kiln Maintenance"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Department</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g. Operations"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Immediate Supervisor</label>
              <input
                type="text"
                value={supervisor}
                onChange={e => setSupervisor(e.target.value)}
                className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Enter supervisor name"
                required
              />
            </div>
          </div>
        </div>

        {/* Worker Category */}
        <div className="border-t pt-4 text-left">
          <div className="space-y-1.5 max-w-xs">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Worker Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            >
              <option value="Senior Staff">Senior Staff</option>
              <option value="Junior Staff">Junior Staff</option>
              <option value="Contract Workers">Contract Workers</option>
            </select>
          </div>
        </div>

        {/* ── SECTION 2: DATE & TIME OF OVERTIME WORK ── */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex justify-between items-baseline">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800">
              2. Date &amp; Time of Overtime Work
            </h3>
            <button
              type="button"
              onClick={addRow}
              className="text-yellow-600 hover:text-yellow-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Row
            </button>
          </div>

          {/* ── Grouped column header (mirrors the screenshot) ── */}
          <div className="border border-zinc-200 rounded overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                {/* Top group header row */}
                <tr className="bg-zinc-800 text-white text-[9px] font-extrabold uppercase tracking-wider">
                  <th className="py-2 px-2 border-r border-zinc-700" rowSpan={2} style={{ width: "120px" }}>Date</th>
                  <th className="py-2 px-2 border-r border-zinc-700" colSpan={2} style={{ width: "200px" }}>Time</th>
                  <th className="py-2 px-2 border-r border-zinc-700 text-center" colSpan={3}>Hours — Straight Day Workers</th>
                  <th className="py-2 px-2 border-r border-zinc-700 text-center" colSpan={4}>Overtime — Shift Workers</th>
                  <th className="py-2 px-2 text-center" rowSpan={2} style={{ width: "36px" }}>Del</th>
                </tr>
                {/* Sub-header row with type labels */}
                <tr className="bg-zinc-700 text-zinc-200 text-[9px] font-bold uppercase tracking-wider">
                  {/* Time sub-cols */}
                  <th className="py-1.5 px-2 border-r border-zinc-600 text-center" style={{ width: "110px" }}>START (12h)</th>
                  <th className="py-1.5 px-2 border-r border-zinc-600 text-center" style={{ width: "90px" }}>FINISH (24h)</th>
                  {/* Straight day types */}
                  {STRAIGHT_DAY_TYPES.map(t => (
                    <th key={t} className="py-1.5 px-2 border-r border-zinc-600 text-center" style={{ minWidth: "80px" }}>
                      {t}
                      <span className="block text-yellow-400 font-extrabold normal-case">{MULTIPLIER_LABELS[t]}</span>
                    </th>
                  ))}
                  {/* Shift worker types */}
                  {SHIFT_WORKER_TYPES.map(t => (
                    <th key={t} className="py-1.5 px-2 border-r border-zinc-600 text-center" style={{ minWidth: "80px" }}>
                      {t}
                      <span className="block text-yellow-400 font-extrabold normal-case">{MULTIPLIER_LABELS[t]}</span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-b-0 hover:bg-zinc-50/60 transition-colors">
                    {/* DATE */}
                    <td className="p-1.5 border-r">
                      <input
                        type="date"
                        value={row.date}
                        onChange={e => handleRowChange(idx, "date", e.target.value)}
                        className="w-full border border-zinc-200 rounded p-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 font-semibold"
                        required
                      />
                    </td>

                    {/* START TIME (12h, editable with datalist) */}
                    <td className="p-1.5 border-r">
                      <input
                        type="text"
                        list={`start-${idx}`}
                        value={row.startTime}
                        onChange={e => handleRowChange(idx, "startTime", e.target.value)}
                        placeholder="e.g. 07:30 AM"
                        className="w-full border border-zinc-200 rounded p-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 font-semibold"
                        required
                      />
                      <datalist id={`start-${idx}`}>
                        {START_TIME_OPTIONS_12H.map(o => <option key={o} value={o} />)}
                      </datalist>
                    </td>

                    {/* FINISH TIME (24h, editable with datalist) */}
                    <td className="p-1.5 border-r">
                      <input
                        type="text"
                        list={`finish-${idx}`}
                        value={row.endTime}
                        onChange={e => handleRowChange(idx, "endTime", e.target.value)}
                        placeholder="e.g. 18:29"
                        className="w-full border border-zinc-200 rounded p-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 font-semibold"
                        required
                      />
                      <datalist id={`finish-${idx}`}>
                        {FINISH_TIME_OPTIONS_24H.map(o => <option key={o} value={o} />)}
                      </datalist>
                    </td>

                    {/* DAY-TYPE SELECTOR — hidden; each type column auto-renders hours if selected */}
                    {/* The Overtime Type selector is embedded as a small badge overlay on the appropriate cell */}
                    {ALL_OVERTIME_TYPES.map(typ => {
                      const isSelected = row.overtimeType === typ;
                      return (
                        <td
                          key={typ}
                          className={`p-1.5 border-r text-center cursor-pointer select-none transition-colors ${
                            isSelected
                              ? "bg-yellow-50 border border-yellow-300"
                              : "hover:bg-zinc-50"
                          }`}
                          onClick={() => handleRowChange(idx, "overtimeType", typ)}
                          title={`Click to set this row as ${typ}`}
                        >
                          {isSelected ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs font-extrabold text-zinc-900 bg-yellow-400/20 px-1.5 py-0.5 rounded">
                                {row.actHours > 0 ? formatDecimalToHMM(row.actHours) : "—"}
                              </span>
                              {typ === "WEEKDAY" && row.startTime && row.endTime && (
                                <span className="text-[8px] text-zinc-400">−9h shift</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-200 text-[9px]">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* DELETE */}
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={rows.length === 1}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* TOTALS FOOTER ROW */}
              <tfoot>
                <tr className="bg-zinc-100 border-t-2 border-zinc-300 font-extrabold">
                  <td className="p-2 border-r text-[10px] uppercase tracking-wider text-zinc-600" colSpan={3}>
                    Total
                  </td>
                  {ALL_OVERTIME_TYPES.map(typ => (
                    <td key={typ} className="p-2 border-r text-center">
                      {colTotals[typ] > 0 ? (
                        <span className="text-xs font-extrabold text-zinc-900 bg-yellow-400/20 px-1.5 py-0.5 rounded">
                          {formatDecimalToHMM(colTotals[typ])}
                        </span>
                      ) : (
                        <span className="text-zinc-300 text-[10px]">—</span>
                      )}
                    </td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Formula note */}
          <div className="text-[10px] text-zinc-400 italic space-y-0.5 text-left pl-1">
            <p>• <strong>WEEKDAY</strong>: Overtime = (Finish − Start) − 9:00 hrs normal shift &nbsp;|&nbsp; Click a type cell to assign it to a row.</p>
            <p>• <strong>All other types</strong>: Overtime = full duration (Finish − Start). Multiplier shown in each column header.</p>
          </div>
        </div>

        {/* ── SECTION 3: EXPLANATION ── */}
        <div className="space-y-2 border-t pt-4">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-600 block">
            3. Explanation of Work Requiring Overtime
          </label>
          <textarea
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            rows={4}
            className="w-full border border-zinc-300 rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Please describe scope of work in details."
            required
          />
        </div>

        {/* ── SECTION 4: INTERNAL VALIDATION & SIGN-OFFS ── */}
        <div className="space-y-4 border-t pt-4 bg-zinc-50/50 p-4 rounded border border-zinc-200 shadow-inner">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
            Internal Validation &amp; Sign-Offs (Workflow Status)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-zinc-600">
            {/* ← Supervisor → Head of Department or Departmental Manager */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400">Head of Department / Departmental Manager</span>
              <div className="h-9 border border-dashed rounded flex items-center px-3 bg-white italic text-[11px] text-zinc-400">
                Awaiting approval routing...
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400">Date of Approval</span>
              <div className="h-9 border border-dashed rounded flex items-center px-3 bg-white text-[11px] text-zinc-400">
                --/--/----
              </div>
            </div>
            {/* ← HR Representative → HR Approval */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400">HR Approval</span>
              <div className="h-9 border border-dashed rounded flex items-center px-3 bg-white italic text-[11px] text-zinc-400">
                Awaiting sign-off...
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400">Date of Approval</span>
              <div className="h-9 border border-dashed rounded flex items-center px-3 bg-white text-[11px] text-zinc-400">
                --/--/----
              </div>
            </div>
          </div>
        </div>

        {/* ── DECLARATION ── */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="declaration"
              checked={declaration}
              onChange={e => setDeclaration(e.target.checked)}
              className="mt-1 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-zinc-300 rounded cursor-pointer"
              required
            />
            <label htmlFor="declaration" className="text-xs text-zinc-600 leading-normal cursor-pointer select-none font-medium">
              I hereby declare that the details provided are accurate and the overtime hours represented reflect actual, necessary operational tasks.
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-600 block">
                Employee Signature (Name Confirmation)
              </label>
              <input
                type="text"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                className="w-full h-10 border border-zinc-300 rounded px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 font-semibold"
                placeholder="Type your full name to sign"
                required
              />
            </div>
          </div>
        </div>

        {/* ── SUBMIT ── */}
        <div className="border-t pt-6">
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-zinc-950 font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded shadow transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" /> Submit Overtime Request
          </button>
        </div>

      </form>

      {/* ── Footer notice ── */}
      <div className="mt-8 border-t pt-4 text-[10px] leading-relaxed text-zinc-400 uppercase tracking-wider space-y-1 border-dashed">
        <p>• In the event of an emergency, the form must be completed within the week of the overtime worked.</p>
        <p>• It is the responsibility of the employee to submit a signed timesheet before payroll is completed.</p>
      </div>

      {/* ── SUBMISSION HISTORY (visible once Employee ID is entered + submitted) ── */}
      {showHistory && employeeId.trim() && (
        <SubmissionHistory employeeId={employeeId.trim()} />
      )}

    </div>
  );
};
