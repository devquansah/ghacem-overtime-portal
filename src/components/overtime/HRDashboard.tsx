import React, { useState } from "react";
import { useOvertime, calculateRowHours } from "@/lib/overtime/store";
import { Search, Filter, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { formatDecimalToHMM } from "./RequestForm";

const START_TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

const END_TIME_OPTIONS = Array.from({ length: 193 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

export const HRDashboard: React.FC = () => {
  const { requests, updateRequestHours, markRequestAsPaid } = useOvertime();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edit states for hours adjustment
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRows, setEditRows] = useState<any[]>([]);

  const startEditing = (request: any) => {
    setEditingId(request.id);
    setEditRows(JSON.parse(JSON.stringify(request.rows))); // deep copy
  };

  const handleEditRowFieldChange = (index: number, field: string, val: any) => {
    const updated = [...editRows];
    updated[index] = { ...updated[index], [field]: val };
    if (field === "startTime" || field === "endTime" || field === "overtimeType") {
      updated[index].actHours = calculateRowHours(
        updated[index].startTime,
        updated[index].endTime,
        updated[index].overtimeType
      );
    }
    setEditRows(updated);
  };
 
  const saveAdjustments = (id: string) => {
    const totalAct = editRows.reduce((sum, r) => sum + (r.actHours ?? r.hours ?? 0), 0);
    const totalEst = editRows.reduce((sum, r) => sum + (Number(r.estHours) || 0), 0);
    updateRequestHours(id, editRows, totalEst, totalAct);
    setEditingId(null);
  };

  // Toggle row expand
  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = 
      statusFilter === "All" 
        ? r.status !== "Paid" 
        : r.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || r.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-zinc-950 border-l-4 border-l-yellow-500 p-6 rounded-xl shadow-lg border-b border-zinc-900 text-white flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6.5 w-6.5" /> HR Overtime Audit & Monitoring Log
          </h2>
          <p className="text-xs text-yellow-400 mt-1 uppercase tracking-wider font-semibold">
            Centralized monitoring ledger for tracking compliance, timesheets, and manager approvals.
          </p>
        </div>
      </div>

      {/* FILTERS CONTROL PANEL */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, Name, or Department..."
            className="w-full h-10 border border-zinc-300 rounded-lg pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 border border-zinc-300 rounded-lg text-xs px-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white font-semibold text-zinc-700"
          >
            <option value="All">Active Requests</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Paid">Paid (Archived)</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 border border-zinc-300 rounded-lg text-xs px-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white font-semibold text-zinc-700"
          >
            <option value="All">All Workers</option>
            <option value="Senior Staff">Senior Staff</option>
            <option value="Junior Staff">Junior Staff</option>
            <option value="Contract Workers">Contract Workers</option>
          </select>
        </div>

      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-100 border-b text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-[6%] text-center">Detail</th>
                <th className="py-3.5 px-3 w-[12%]">Request ID</th>
                <th className="py-3.5 px-3 w-[12%]">Date</th>
                <th className="py-3.5 px-3 w-[12%]">Employee ID</th>
                <th className="py-3.5 px-3 w-[20%]">Employee Name</th>
                <th className="py-3.5 px-3 w-[14%]">Department</th>
                <th className="py-3.5 px-3 w-[8%] text-right">Hours</th>
                <th className="py-3.5 px-3 w-[12%] text-center">Status</th>
                <th className="py-3.5 px-4 w-[16%]">Approved By</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(r => {
                const isExpanded = expandedId === r.id;
                
                // Styles based on status
                let statusStyle = "bg-amber-50 text-amber-700 border-amber-200";
                if (r.status === "Approved") statusStyle = "bg-green-50 text-green-700 border-green-200";
                if (r.status === "Rejected") statusStyle = "bg-red-50 text-red-700 border-red-200";
                if (r.status === "Paid") statusStyle = "bg-zinc-950 text-yellow-500 border-zinc-900 font-extrabold";

                return (
                  <React.Fragment key={r.id}>
                    <tr className="border-b last:border-b-0 hover:bg-zinc-50/50 transition-colors font-medium">
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleRow(r.id)}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-600 focus:outline-none"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="p-3 font-extrabold text-zinc-900">{r.id}</td>
                      <td className="p-3 font-semibold text-zinc-600">{r.dateCompleted}</td>
                      <td className="p-3 font-bold text-zinc-700">{r.employeeId}</td>
                      <td className="p-3 font-bold text-zinc-950">{r.employeeName}</td>
                      <td className="p-3 font-semibold">{r.department}</td>
                      <td className="p-3 text-right font-extrabold text-zinc-800">{formatDecimalToHMM(r.totalActHours ?? r.totalHours ?? 0)}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${statusStyle}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-zinc-500 capitalize">{r.approvedBy || "--"}</td>
                    </tr>
                    
                    {/* Expanded panel details */}
                    {isExpanded && (
                      <tr className="bg-zinc-50/70 border-b">
                        <td colSpan={9} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left border-l-2 border-l-yellow-500 pl-4 py-1">
                            
                            <div className="space-y-3">
                              <div>
                                <span className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider">Overtime Rows Details</span>
                                <div className="border border-zinc-200 rounded mt-1 bg-white overflow-hidden shadow-inner">
                                  <table className="w-full text-[11px] text-zinc-600">
                                     <thead className="bg-zinc-50 border-b text-[9px] font-extrabold uppercase text-zinc-500">
                                      <tr>
                                        <th className="p-1.5 border-r">Est. Hrs</th>
                                        <th className="p-1.5 border-r">Date</th>
                                        <th className="p-1.5 border-r">Start</th>
                                        <th className="p-1.5 border-r">Finish</th>
                                        <th className="p-1.5 border-r">Weekday</th>
                                        <th className="p-1.5 border-r">Weekend</th>
                                        <th className="p-1.5 border-r">Pub.Hol</th>
                                        <th className="p-1.5 border-r">R.W.Day</th>
                                        <th className="p-1.5 border-r">Off-Duty</th>
                                        <th className="p-1.5 border-r">P.Hol</th>
                                        <th className="p-1.5 border-r">P.Hol OD</th>
                                        <th className="p-1.5">Select Type</th>
                                      </tr>
                                     </thead>
                                    <tbody>
                                      {r.rows.map((row, idx) => {
                                        const isEditing = editingId === r.id;
                                        const editRow = editRows[idx];
                                        return (
                                          <tr key={idx} className="border-b last:border-b-0 text-[10px]">
                                            <td className="p-1.5 border-r text-center">
                                              {isEditing ? (
                                                <input
                                                  type="number" step="0.5" min="0"
                                                  value={editRow?.estHours ?? ""}
                                                  onChange={(e) => handleEditRowFieldChange(idx, "estHours", parseFloat(e.target.value) || 0)}
                                                  className="w-12 border rounded px-1 py-0.5 text-[10px] text-center"
                                                />
                                              ) : (row.estHours ?? 0).toFixed(1)}
                                            </td>
                                            <td className="p-1.5 border-r">
                                              {isEditing ? (
                                                <input
                                                  type="text"
                                                  value={editRow?.date ?? ""}
                                                  onChange={(e) => handleEditRowFieldChange(idx, "date", e.target.value)}
                                                  className="w-full border rounded px-1 py-0.5 text-[10px]"
                                                />
                                              ) : row.date}
                                            </td>
                                            <td className="p-1 border-r text-center">
                                              {isEditing ? (
                                                <select
                                                  value={editRow?.startTime ?? ""}
                                                  onChange={(e) => handleEditRowFieldChange(idx, "startTime", e.target.value)}
                                                  className="border rounded p-0.5 text-[10px] w-20 text-center"
                                                >
                                                  <option value="">--:--</option>
                                                  {START_TIME_OPTIONS.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                  ))}
                                                </select>
                                              ) : row.startTime}
                                            </td>
                                            <td className="p-1 border-r text-center">
                                              {isEditing ? (
                                                <select
                                                  value={editRow?.endTime ?? ""}
                                                  onChange={(e) => handleEditRowFieldChange(idx, "endTime", e.target.value)}
                                                  className="border rounded p-0.5 text-[10px] w-20 text-center"
                                                >
                                                  <option value="">--:--</option>
                                                  {END_TIME_OPTIONS.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                  ))}
                                                </select>
                                              ) : row.endTime}
                                            </td>
                                            {/* 7 actual columns */}
                                            {["WEEKDAY","WEEKEND","PUBLIC HOLIDAY","REST DAY","OFF DUTY","P.HOL","P.HOL OFF-DUTY"].map(typ => (
                                              <td key={typ} className="p-1 border-r text-center font-bold">
                                                {row.overtimeType === typ ? formatDecimalToHMM(row.actHours ?? row.hours ?? 0) : "-"}
                                              </td>
                                            ))}
                                            {/* Select Type */}
                                            <td className="p-1 border-r">
                                              {isEditing ? (
                                                <select
                                                  value={editRow?.overtimeType ?? "WEEKDAY"}
                                                  onChange={(e) => handleEditRowFieldChange(idx, "overtimeType", e.target.value)}
                                                  className="w-full border rounded p-0.5 text-[10px]"
                                                >
                                                  <option value="WEEKDAY">WEEKDAY</option>
                                                  <option value="WEEKEND">WEEKEND</option>
                                                  <option value="PUBLIC HOLIDAY">PUBLIC HOLIDAY</option>
                                                  <option value="REST DAY">REST DAY</option>
                                                  <option value="OFF DUTY">OFF DUTY</option>
                                                  <option value="P.HOL">P.HOL</option>
                                                  <option value="P.HOL OFF-DUTY">P.HOL OFF-DUTY</option>
                                                </select>
                                              ) : (
                                                <span className="text-yellow-700 font-extrabold text-[9px]">{row.overtimeType}</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-[11px] py-1 bg-white px-3 rounded border gap-4">
                                <span className="font-semibold text-zinc-500">
                                  Est. Hours:{" "}
                                  <span className="text-zinc-800 font-extrabold">
                                    {editingId === r.id
                                      ? editRows.reduce((sum, row) => sum + (Number(row.estHours) || 0), 0).toFixed(1)
                                      : (r.totalEstHours ?? r.totalHours ?? 0).toFixed(1)}
                                  </span>
                                </span>
                                <span className="font-semibold text-zinc-500">
                                  Actual Hours:{" "}
                                  <span className="text-zinc-800 font-extrabold">
                                    {editingId === r.id
                                      ? formatDecimalToHMM(editRows.reduce((sum, row) => sum + (row.actHours ?? row.hours ?? 0), 0))
                                      : formatDecimalToHMM(r.totalActHours ?? r.totalHours ?? 0)}
                                  </span>
                                </span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <span className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider">Explanation of Work</span>
                                <p className="text-[11px] text-zinc-700 bg-white p-2.5 rounded border border-zinc-200 mt-1 italic leading-relaxed">
                                  "{r.explanation}"
                                </p>
                              </div>
                              {r.comments && (
                                <div>
                                  <span className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider">Review Comments</span>
                                  <p className="text-[11px] text-zinc-800 bg-zinc-50 p-2.5 rounded border border-zinc-200 mt-1 italic leading-relaxed font-semibold">
                                    "{r.comments}"
                                  </p>
                                </div>
                              )}
                              <div className="flex justify-between text-[11px] text-zinc-500 pt-1.5 border-t border-dashed">
                                <span>Declaration Signature: <span className="font-extrabold text-zinc-800 underline">{r.signature}</span></span>
                                {r.dateApproved && <span>Approved Date: <span className="font-bold text-zinc-700">{r.dateApproved}</span></span>}
                              </div>
                              
                              <div className="flex gap-2 justify-end pt-3">
                                {editingId === r.id ? (
                                  <>
                                    <button
                                      onClick={() => saveAdjustments(r.id)}
                                      className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-zinc-950 font-extrabold font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                                    >
                                      Save Hours
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="px-3.5 py-1.5 bg-zinc-500 hover:bg-zinc-600 text-white font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {r.status === "Approved" && (
                                      <button
                                        onClick={() => markRequestAsPaid(r.id)}
                                        className="px-3.5 py-1.5 bg-zinc-900 border border-yellow-500 text-yellow-500 hover:bg-zinc-850 font-extrabold font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                                      >
                                        Mark as Paid & Clear
                                      </button>
                                    )}
                                    <button
                                      onClick={() => startEditing(r)}
                                      className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-750 font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer transition-colors"
                                    >
                                      Adjust Hours
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-xs font-bold text-zinc-400 italic">
                    No matching overtime requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

