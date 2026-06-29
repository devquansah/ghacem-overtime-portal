import React, { useState } from "react";
import { useOvertime } from "@/lib/overtime/store";
import { toast } from "sonner";
import { Check, X, FileText, UserCheck } from "lucide-react";

export const ApprovalCenter: React.FC = () => {
  const { requests, approveRequest, rejectRequest } = useOvertime();
  const [selectedId, setSelectedId] = useState("");
  const [comments, setComments] = useState("");
  const [approver, setApprover] = useState("");

  const pendingRequests = requests.filter(r => r.status === "Pending");
  const currentReq = requests.find(r => r.id === selectedId);

  const handleAction = (status: "Approved" | "Rejected") => {
    if (!selectedId) {
      toast.error("Please select a pending Request ID first.");
      return;
    }
    if (!approver) {
      toast.error("Please enter your name as the Reviewer Sign-Off.");
      return;
    }

    if (status === "Approved") {
      approveRequest(selectedId, approver, comments);
      toast.success(`Request ${selectedId} has been APPROVED.`);
    } else {
      rejectRequest(selectedId, approver, comments);
      toast.error(`Request ${selectedId} has been REJECTED.`);
    }

    setSelectedId("");
    setComments("");
    setApprover("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Overview Card */}
      <div className="bg-zinc-950 border-l-4 border-l-yellow-500 p-6 rounded-xl shadow-lg  text-white flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Supervisor Approval Center</h2>
          <p className="text-xs text-yellow-400 mt-1 uppercase tracking-wider font-semibold">
            Evaluate pending employee overtime requests and log sign-offs.
          </p>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-sm">
          <span className="text-3xl font-extrabold">{pendingRequests.length}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider block text-yellow-100">
            Pending Queue
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PENDING LIST */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
            Pending Requests
          </h3>
          <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
            {pendingRequests.map(r => (
              <div
                key={r.id}
                onClick={() => {
                  setSelectedId(r.id);
                  setComments("");
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all select-none text-left ${
                  selectedId === r.id
                    ? "border-yellow-500 bg-yellow-50/60 ring-2 ring-yellow-200"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-extrabold text-xs text-zinc-900">{r.id}</span>
                  <span className="text-[10px] text-zinc-400 font-bold">{r.dateCompleted}</span>
                </div>
                <div className="text-xs font-bold text-zinc-700">{r.employeeName}</div>
                <div className="text-[10px] text-zinc-500 flex justify-between mt-1.5 font-semibold">
                  <span>{r.department}</span>
                  <span className="text-yellow-600">{r.totalActHours} hrs (Act)</span>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <div className="text-center py-10 text-xs font-bold text-zinc-400 italic">
                No pending requests.
              </div>
            )}
          </div>
        </div>

        {/* REVIEW DETAIL PANEL */}
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

              {/* Time details table */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                  Overtime Slots
                </span>
                <div className="border border-zinc-200 rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50 border-b text-[10px] font-extrabold text-zinc-500 uppercase">
                      <tr>
                        <th className="p-2 border-r" rowSpan={2}>Date</th>
                        <th className="p-2 border-r" rowSpan={2}>Type</th>
                        <th className="p-2 border-r text-center" colSpan={3}>Estimate</th>
                        <th className="p-2 text-center" colSpan={3}>Actual</th>
                      </tr>
                      <tr className="bg-zinc-100/50 border-b text-[8px] font-bold text-zinc-400 uppercase">
                        <th className="p-1 border-r text-center">Start</th>
                        <th className="p-1 border-r text-center">End</th>
                        <th className="p-1 border-r text-right">Hours</th>
                        <th className="p-1 border-r text-center">Start</th>
                        <th className="p-1 border-r text-center">End</th>
                        <th className="p-1 text-right">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReq.rows.map((row, idx) => (
                        <tr key={idx} className="border-b last:border-b-0">
                          <td className="p-2 border-r font-medium">{row.date}</td>
                          <td className="p-2 border-r font-semibold text-zinc-600">{row.overtimeType}</td>
                          <td className="p-1.5 border-r text-center text-zinc-500">{row.estStartTime}</td>
                          <td className="p-1.5 border-r text-center text-zinc-500">{row.estEndTime}</td>
                          <td className="p-1.5 border-r text-right font-bold bg-zinc-50/20">{row.estHours.toFixed(2)}</td>
                          <td className="p-1.5 border-r text-center text-zinc-600 font-medium">{row.actStartTime}</td>
                          <td className="p-1.5 border-r text-center text-zinc-600 font-medium">{row.actEndTime}</td>
                          <td className="p-1.5 text-right font-extrabold bg-zinc-50/40">{row.actHours.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center bg-zinc-50 p-2.5 rounded border border-zinc-200 text-xs">
                  <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Total Est. Hours: <span className="text-zinc-900 font-extrabold">{currentReq.totalEstHours.toFixed(2)}</span></span>
                  <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Total Act. Hours: <span className="text-zinc-900 font-extrabold">{currentReq.totalActHours.toFixed(2)}</span></span>
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-1 bg-zinc-50/30 p-3.5 border rounded border-zinc-200">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-1">
                  Explanation of Overtime
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

              {/* Action Area */}
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-600">Reviewer Sign-off (Your Name)</label>
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
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-600">Decision Comments (Optional)</label>
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
                    className="h-11 bg-yellow-500 hover:bg-yellow-600 text-zinc-950 font-extrabold font-extrabold text-xs uppercase tracking-wider rounded shadow flex items-center justify-center gap-1.5 transition-colors"
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
                Select a pending request from the queue list to review details and action approval.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};



