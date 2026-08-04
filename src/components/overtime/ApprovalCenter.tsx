import React, { useState } from "react";
import { useOvertime, OvertimeRequest } from "@/lib/overtime/store";
import { toast } from "sonner";
import { Check, X, FileText, Clock, History, Search, Filter, CheckCircle2, XCircle, Banknote, ChevronDown, ChevronUp, Inbox } from "lucide-react";
import { formatDecimalToHMM } from "./RequestForm";

// Status Badge Helper
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    Pending: {
      color: "bg-yellow-50 text-yellow-700 border-yellow-300",
      icon: <Clock className="h-3 w-3" />,
      label: "Pending",
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
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

export const ApprovalCenter: React.FC = () => {
  const { requests, approveRequest, rejectRequest } = useOvertime();

  // Active View Tab: "pending" | "history"
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  // Pending queue selection & review inputs
  const [selectedId, setSelectedId] = useState<string>("");
  const [comments, setComments] = useState("");
  const [approver, setApprover] = useState("");

  // History search & filters
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All");
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Filter requests
  const pendingRequests = requests.filter(r => r.status === "Pending");
  const historyRequests = requests.filter(r => r.status !== "Pending");

  // Selected pending request detail
  const currentReq = pendingRequests.find(r => r.id === selectedId);

  // Handle Approve / Reject
  const handleAction = (actionStatus: "Approved" | "Rejected") => {
    if (!selectedId) {
      toast.error("Please select a pending Request ID first.");
      return;
    }
    if (!approver.trim()) {
      toast.error("Please enter your name for Reviewer Sign-Off.");
      return;
    }

    if (actionStatus === "Approved") {
      approveRequest(selectedId, approver.trim(), comments.trim());
      toast.success(`Request ${selectedId} has been APPROVED and moved to History.`);
    } else {
      rejectRequest(selectedId, approver.trim(), comments.trim());
      toast.error(`Request ${selectedId} has been REJECTED and moved to History.`);
    }

    // Reset selection & inputs
    setSelectedId("");
    setComments("");
    setApprover("");
  };

  // Filtered History items
  const filteredHistory = historyRequests.filter(r => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(historySearch.toLowerCase()) ||
      r.id.toLowerCase().includes(historySearch.toLowerCase()) ||
      r.department.toLowerCase().includes(historySearch.toLowerCase());
    const matchesStatus = historyStatusFilter === "All" || r.status === historyStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left">
      
      {/* ── Top Header Banner ── */}
      <div className="bg-zinc-950 border-l-4 border-l-yellow-500 p-6 rounded-xl shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-yellow-500" /> Supervisor Approval Center
          </h2>
          <p className="text-xs text-yellow-400 mt-1 uppercase tracking-wider font-semibold">
            Evaluate pending employee overtime requests and maintain processed decision records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-sm text-center">
            <span className="text-2xl font-extrabold">{pendingRequests.length}</span>
            <span className="text-[9px] uppercase font-bold tracking-wider block text-yellow-200">
              Pending Queue
            </span>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-sm text-center">
            <span className="text-2xl font-extrabold">{historyRequests.length}</span>
            <span className="text-[9px] uppercase font-bold tracking-wider block text-zinc-300">
              History Reference
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-zinc-200 gap-2 bg-white p-1 rounded-t-xl border">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-extrabold text-xs uppercase tracking-wider transition-colors ${
            activeTab === "pending"
              ? "bg-yellow-500 text-zinc-950 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending Requests
          {pendingRequests.length > 0 && (
            <span className="ml-1.5 bg-zinc-950 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-extrabold text-xs uppercase tracking-wider transition-colors ${
            activeTab === "history"
              ? "bg-yellow-500 text-zinc-950 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          <History className="h-4 w-4" />
          Approval History &amp; Reference Log
          <span className="ml-1.5 bg-zinc-200 text-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {historyRequests.length}
          </span>
        </button>
      </div>

      {/* ── TAB 1: PENDING REQUESTS ── */}
      {activeTab === "pending" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* PENDING LIST PANEL */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-500">
                Pending Queue ({pendingRequests.length})
              </h3>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {pendingRequests.map(r => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedId(r.id);
                    setComments("");
                  }}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all select-none text-left ${
                    selectedId === r.id
                      ? "border-yellow-500 bg-yellow-50/70 ring-2 ring-yellow-300"
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-extrabold text-xs text-zinc-900">{r.id}</span>
                    <span className="text-[10px] text-zinc-400 font-bold">{r.dateCompleted}</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-800">{r.employeeName}</div>
                  <div className="text-[10px] text-zinc-500 flex justify-between mt-1.5 font-semibold">
                    <span>{r.department}</span>
                    <span className="text-yellow-700 font-extrabold">{formatDecimalToHMM(r.totalActHours ?? r.totalHours ?? 0)} act. hrs</span>
                  </div>
                </div>
              ))}

              {/* Empty Queue State */}
              {pendingRequests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 space-y-3">
                  <Inbox className="h-10 w-10 text-zinc-300" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold uppercase text-zinc-700 tracking-wider">Queue Empty</h4>
                    <p className="text-[11px] text-zinc-500 leading-normal max-w-[200px]">
                      No pending requests awaiting approval. Newly submitted employee forms will appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* REVIEW DETAIL & ACTION PANEL */}
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm md:col-span-2 space-y-6 text-left">
            {currentReq ? (
              <div className="space-y-6">
                
                {/* Header Info */}
                <div className="flex justify-between items-start border-b pb-3.5">
                  <div>
                    <h4 className="text-base font-extrabold text-zinc-950">{currentReq.employeeName}</h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                      {currentReq.jobTitle} • {currentReq.department} ({currentReq.category})
                    </p>
                  </div>
                  <div className="bg-zinc-100 px-3 py-1 rounded border text-[11px] font-extrabold text-zinc-700">
                    {currentReq.id}
                  </div>
                </div>

                {/* Overtime Slots Table */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                    Overtime Slots Breakdown
                  </span>
                  <div className="border border-zinc-200 rounded overflow-hidden overflow-x-auto">
                    <table className="w-full text-xs min-w-[750px]">
                      <thead className="bg-zinc-100 border-b text-[9px] font-extrabold text-zinc-600 uppercase text-center">
                        <tr>
                          <th className="p-2 border-r" rowSpan={2}>Est. OT Hrs</th>
                          <th className="p-2 border-r" rowSpan={2}>Date</th>
                          <th className="p-2 border-r" rowSpan={2}>Start</th>
                          <th className="p-2 border-r" rowSpan={2}>Finish</th>
                          <th className="p-2 border-r" colSpan={3}>Straight Day Workers</th>
                          <th className="p-2 border-r" colSpan={4}>Shift Workers</th>
                          <th className="p-2 border-r" rowSpan={2}>Type</th>
                        </tr>
                        <tr>
                          <th className="p-1 border-r">Weekday</th>
                          <th className="p-1 border-r">Weekend</th>
                          <th className="p-1 border-r">Pub. Hol</th>
                          <th className="p-1 border-r">R.W.Day</th>
                          <th className="p-1 border-r">Off-Duty</th>
                          <th className="p-1 border-r">P.Hol</th>
                          <th className="p-1 border-r">P.Hol O.D</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentReq.rows.map((row, idx) => (
                          <tr key={idx} className="border-b last:border-b-0 text-center">
                            <td className="p-2 border-r font-semibold">{(row.estHours ?? 0).toFixed(1)}</td>
                            <td className="p-2 border-r font-medium whitespace-nowrap">{row.date}</td>
                            <td className="p-2 border-r text-zinc-600 font-semibold">{row.startTime}</td>
                            <td className="p-2 border-r text-zinc-600 font-semibold">{row.endTime}</td>
                            <td className="p-2 border-r font-bold">{row.overtimeType === "WEEKDAY" ? formatDecimalToHMM(row.actHours ?? row.hours ?? 0) : "-"}</td>
                            <td className="p-2 border-r font-bold">{row.overtimeType === "WEEKEND" ? formatDecimalToHMM(row.actHours ?? row.hours ?? 0) : "-"}</td>
                            <td className="p-2 border-r font-bold">{row.overtimeType === "PUBLIC HOLIDAY" ? formatDecimalToHMM(row.actHours ?? row.hours ?? 0) : "-"}</td>
                            <td className="p-2 border-r font-bold">{row.overtimeType === "REST DAY" ? formatDecimalToHMM(row.actHours ?? row.hours ?? 0) : "-"}</td>
                            <td className="p-2 border-r font-bold">{row.overtimeType === "OFF DUTY" ? formatDecimalToHMM(row.actHours ?? row.hours ?? 0) : "-"}</td>
                            <td className="p-2 border-r font-bold">{row.overtimeType === "P.HOL" ? formatDecimalToHMM(row.actHours ?? row.hours ?? 0) : "-"}</td>
                            <td className="p-2 border-r font-bold">{row.overtimeType === "P.HOL OFF-DUTY" ? formatDecimalToHMM(row.actHours ?? row.hours ?? 0) : "-"}</td>
                            <td className="p-2 border-r text-[9px] font-extrabold text-yellow-700">{row.overtimeType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end items-center gap-4 bg-zinc-50 p-2.5 rounded border border-zinc-200 text-xs">
                    <span className="font-semibold text-zinc-600">Est: <span className="font-extrabold text-zinc-900">{(currentReq.totalEstHours ?? currentReq.totalHours ?? 0).toFixed(1)} hrs</span></span>
                    <span className="font-semibold text-zinc-600">Actual: <span className="font-extrabold text-zinc-900">{formatDecimalToHMM(currentReq.totalActHours ?? currentReq.totalHours ?? 0)}</span></span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="space-y-1 bg-zinc-50/50 p-3.5 border rounded border-zinc-200">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-1">
                    Explanation of Work Requiring Overtime
                  </span>
                  <p className="text-xs text-zinc-700 font-medium leading-relaxed italic">
                    "{currentReq.explanation}"
                  </p>
                </div>

                {/* Declaration Signature */}
                <div className="flex justify-between text-xs py-2 border-y border-dashed text-zinc-600 font-medium">
                  <span>Employee Signature Confirmation:</span>
                  <span className="font-extrabold text-zinc-950 underline">{currentReq.signature}</span>
                </div>

                {/* Action Inputs */}
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-600">
                        Reviewer Sign-off (Head of Department Name)
                      </label>
                      <input
                        type="text"
                        value={approver}
                        onChange={(e) => setApprover(e.target.value)}
                        className="w-full h-10 border border-zinc-300 rounded px-3 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 font-semibold"
                        placeholder="Enter your name to sign"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-600">
                        Decision Comments (Optional)
                      </label>
                      <input
                        type="text"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="w-full h-10 border border-zinc-300 rounded px-3 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        placeholder="Add review notes or reason..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleAction("Approved")}
                      className="h-11 bg-yellow-500 hover:bg-yellow-600 text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded shadow flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Check className="h-4 w-4" /> Approve Request
                    </button>
                    <button
                      onClick={() => handleAction("Rejected")}
                      className="h-11 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-extrabold text-xs uppercase tracking-wider rounded shadow flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <X className="h-4 w-4" /> Reject Request
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-zinc-400 space-y-3">
                <FileText className="h-12 w-12 stroke-1 text-zinc-300" />
                <div className="text-xs font-bold text-center">
                  Select a pending request from the left queue list to review details and action approval.
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── TAB 2: APPROVAL HISTORY & REFERENCE LOG ── */}
      {activeTab === "history" && (
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-6">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <History className="h-4 w-4 text-yellow-600" /> Processed Decision History Log
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                Archived record of all evaluated overtime forms for supervisory audit and reference.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search ID, Name, Department..."
                  className="w-full pl-9 pr-3 py-1.5 border border-zinc-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 font-medium"
                />
              </div>

              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="py-1.5 px-3 border border-zinc-300 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-500"
              >
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {/* History List Table */}
          <div className="space-y-3">
            {filteredHistory.map(req => {
              const isExpanded = expandedHistoryId === req.id;
              return (
                <div key={req.id} className="border border-zinc-200 rounded-lg overflow-hidden transition-all shadow-sm">
                  
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedHistoryId(isExpanded ? null : req.id)}
                    className="p-4 bg-zinc-50/80 hover:bg-zinc-100/80 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-zinc-900">{req.id}</span>
                      <StatusBadge status={req.status} />
                      <span className="font-bold text-zinc-800">{req.employeeName}</span>
                      <span className="text-[10px] text-zinc-400 font-semibold">• {req.department}</span>
                    </div>

                    <div className="flex items-center gap-6 text-[11px] text-zinc-600 font-medium">
                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase font-bold mr-1">Evaluated By:</span>
                        <span className="font-bold text-zinc-800">{req.approvedBy || "—"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase font-bold mr-1">Decision Date:</span>
                        <span>{req.dateApproved || req.dateCompleted}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase font-bold mr-1">Hours:</span>
                        <span className="font-extrabold text-zinc-900">{formatDecimalToHMM(req.totalActHours ?? req.totalHours ?? 0)}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                    </div>
                  </div>

                  {/* Expanded Detail Reference Panel */}
                  {isExpanded && (
                    <div className="p-5 border-t border-zinc-200 bg-white space-y-4 text-xs">
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50 p-3 rounded border text-[11px]">
                        <div>
                          <span className="text-[9px] uppercase font-extrabold text-zinc-400 block">Type of Work</span>
                          <span className="font-bold text-zinc-800">{req.jobTitle}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-extrabold text-zinc-400 block">Category</span>
                          <span className="font-bold text-zinc-800">{req.category}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-extrabold text-zinc-400 block">Immediate Supervisor</span>
                          <span className="font-bold text-zinc-800">{req.supervisor}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-extrabold text-zinc-400 block">Date Submitted</span>
                          <span className="font-bold text-zinc-800">{req.dateCompleted}</span>
                        </div>
                      </div>

                      {/* Decision Notes */}
                      <div className="bg-yellow-50/50 p-3 border border-yellow-200 rounded text-xs space-y-1">
                        <span className="text-[10px] uppercase font-extrabold text-yellow-800 block">Supervisor Decision Comments</span>
                        <p className="text-zinc-700 italic">"{req.comments || "No comments logged."}"</p>
                      </div>

                      {/* Explanation */}
                      <div className="bg-zinc-50 p-3 border rounded text-xs space-y-1">
                        <span className="text-[10px] uppercase font-extrabold text-zinc-400 block">Employee Explanation</span>
                        <p className="text-zinc-700 italic">"{req.explanation}"</p>
                      </div>

                      {/* Slots table */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-extrabold text-zinc-400 block">Logged Slots Detail</span>
                        <div className="border rounded overflow-x-auto">
                          <table className="w-full text-center text-xs">
                            <thead className="bg-zinc-100 text-[9px] font-extrabold text-zinc-600 uppercase border-b">
                              <tr>
                                <th className="p-2 border-r">Date</th>
                                <th className="p-2 border-r">Type</th>
                                <th className="p-2 border-r">Start</th>
                                <th className="p-2 border-r">Finish</th>
                                <th className="p-2">Actual Hours</th>
                              </tr>
                            </thead>
                            <tbody>
                              {req.rows.map((row, i) => (
                                <tr key={i} className="border-b last:border-b-0">
                                  <td className="p-1.5 border-r font-medium">{row.date}</td>
                                  <td className="p-1.5 border-r font-bold text-yellow-700">{row.overtimeType}</td>
                                  <td className="p-1.5 border-r">{row.startTime}</td>
                                  <td className="p-1.5 border-r">{row.endTime}</td>
                                  <td className="p-1.5 font-extrabold">{formatDecimalToHMM(row.actHours ?? row.hours ?? 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}

            {filteredHistory.length === 0 && (
              <div className="text-center py-12 text-zinc-400 text-xs font-bold italic border-2 border-dashed rounded-xl">
                No matching history records found.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
