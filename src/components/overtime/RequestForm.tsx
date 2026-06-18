import React, { useState, useEffect } from "react";
import { useOvertime, calculateRowHours } from "@/lib/overtime/store";
import { toast } from "sonner";
import { Plus, Trash2, FileSpreadsheet, Check } from "lucide-react";

export const RequestForm: React.FC = () => {
  const { employees, multipliers, submitRequest } = useOvertime();

  // Manual Employee Inputs
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [category, setCategory] = useState<"Senior Staff" | "Junior Staff" | "Contract Workers">("Senior Staff");

  // Overtime general fields
  const [overtimeType, setOvertimeType] = useState<"Weekday" | "Weekend" | "Holiday" | "Emergency">("Weekday");
  const [dateCompleted, setDateCompleted] = useState(new Date().toISOString().split("T")[0]);
  
  // Table Rows
  const [rows, setRows] = useState<Array<{
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    hours: number;
  }>>([
    { startDate: "", endDate: "", startTime: "", endTime: "", hours: 0 }
  ]);

  // Explanation, signature declaration
  const [explanation, setExplanation] = useState("");
  const [signature, setSignature] = useState("");
  const [declaration, setDeclaration] = useState(false);

  // Handle row change
  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    
    // Recalculate hours if times change
    if (field === "startTime" || field === "endTime") {
      const row = newRows[index];
      row.hours = calculateRowHours(row.startTime, row.endTime);
    }
    setRows(newRows);
  };

  // Add row
  const addRow = () => {
    setRows([...rows, { startDate: "", endDate: "", startTime: "", endTime: "", hours: 0 }]);
  };

  // Delete row
  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, idx) => idx !== index));
  };

  // Anticipated Overtime Hours (Sum of rows)
  const anticipatedHours = rows.reduce((sum, r) => sum + r.hours, 0);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId.trim()) {
      toast.error("Please enter an Employee ID.");
      return;
    }
    if (!employeeName.trim()) {
      toast.error("Please enter an Employee Name.");
      return;
    }
    if (!jobTitle.trim()) {
      toast.error("Please enter a Job Title.");
      return;
    }
    if (!department.trim()) {
      toast.error("Please enter a Department.");
      return;
    }
    if (!supervisor.trim()) {
      toast.error("Please enter the Immediate Supervisor.");
      return;
    }
    if (!declaration) {
      toast.error("Please check the declaration box before submitting.");
      return;
    }
    if (!signature) {
      toast.error("Please provide your Name Confirmation Signature.");
      return;
    }
    if (!explanation) {
      toast.error("Please explain the reason for this overtime work.");
      return;
    }
    
    // Check if any row is empty or has zero hours
    const invalidRow = rows.some(r => !r.startDate || !r.endDate || !r.startTime || !r.endTime || r.hours <= 0);
    if (invalidRow) {
      toast.error("Please fill in all row inputs with valid times.");
      return;
    }

    // Lookup base rate from employees registry, or fall back to 40.00
    const matchedEmp = employees.find(
      (e) => e.id.trim().toUpperCase() === employeeId.trim().toUpperCase()
    );
    const hourlyRate = matchedEmp ? matchedEmp.hourlyRate : 40.00;

    const requestData = {
      dateCompleted,
      employeeId: employeeId.trim(),
      employeeName: employeeName.trim(),
      jobTitle: jobTitle.trim(),
      department: department.trim(),
      supervisor: supervisor.trim(),
      hourlyRate,
      category,
      overtimeType,
      rows,
      totalHours: anticipatedHours,
      explanation,
      signature
    };

    const requestId = submitRequest(requestData);
    toast.success(`Request Submitted Successfully! ID: ${requestId}`);

    // Reset Form
    setEmployeeId("");
    setEmployeeName("");
    setJobTitle("");
    setDepartment("");
    setSupervisor("");
    setCategory("Senior Staff");
    setRows([{ startDate: "", endDate: "", startTime: "", endTime: "", hours: 0 }]);
    setExplanation("");
    setSignature("");
    setDeclaration(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 border border-zinc-200 shadow-xl rounded-md font-sans text-zinc-800">
      


      {/* Top Banner Notice */}
      <div className="bg-zinc-50 p-4 border-l-4 border-l-yellow-500 text-xs leading-relaxed space-y-1.5 text-zinc-700 rounded mb-8 font-medium text-left">
        <p className="font-bold text-yellow-600 text-sm mb-1">Important Submission Rules:</p>
        <p>• No one may be paid for overtime unless this form has been completed in advance of the overtime work.</p>
        <p>• Overtime is paid only when forty hours have been worked within one normal work week.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: EMPLOYEE DETAILS GRID */}
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
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="e.g. EMP001"
                required
              />
            </div>

            <div className="space-y-1.5 col-span-3">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Employee Name</label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="e.g. Shift Supervisor"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="e.g. Operations"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Immediate Supervisor</label>
              <input
                type="text"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter supervisor name"
                required
              />
            </div>
          </div>
        </div>

        {/* OVERTIME TYPE / CATEGORY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-600">Overtime Type (Multiplier Rate)</label>
            <select
              value={overtimeType}
              onChange={(e) => setOvertimeType(e.target.value as any)}
              className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="Weekday">Weekday (1.5x)</option>
              <option value="Weekend">Weekend (2.0x)</option>
              <option value="Holiday">Holiday (2.5x)</option>
              <option value="Emergency">Emergency (3.0x)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Worker Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-10 border border-zinc-300 rounded px-3 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            >
              <option value="Senior Staff">Senior Staff</option>
              <option value="Junior Staff">Junior Staff</option>
              <option value="Contract Workers">Contract Workers</option>
            </select>
          </div>
        </div>

        {/* SECTION 2: DATE/TIME OF OVERTIME WORK GRID */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex justify-between items-baseline">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800">
              2. Date & Time of Overtime Work
            </h3>
            <button
              type="button"
              onClick={addRow}
              className="text-yellow-600 hover:text-yellow-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 focus:outline-none"
            >
              <Plus className="h-3.5 w-3.5" /> Add Overtime Row
            </button>
          </div>
          
          <div className="border border-zinc-200 rounded overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200 text-[10px] font-extrabold text-zinc-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3 border-r w-[24%]">Start Date</th>
                  <th className="py-2.5 px-3 border-r w-[24%]">End Date</th>
                  <th className="py-2.5 px-3 border-r w-[18%]">Start Time</th>
                  <th className="py-2.5 px-3 border-r w-[18%]">End Time</th>
                  <th className="py-2.5 px-3 border-r w-[12%] text-right">Hours</th>
                  <th className="py-2.5 px-3 w-[4%] text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-b-0 hover:bg-zinc-50/50">
                    <td className="p-2 border-r">
                      <input
                        type="date"
                        value={row.startDate}
                        onChange={(e) => handleRowChange(idx, "startDate", e.target.value)}
                        className="w-full border border-zinc-200 rounded p-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        required
                      />
                    </td>
                    <td className="p-2 border-r">
                      <input
                        type="date"
                        value={row.endDate}
                        onChange={(e) => handleRowChange(idx, "endDate", e.target.value)}
                        className="w-full border border-zinc-200 rounded p-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        required
                      />
                    </td>
                    <td className="p-2 border-r">
                      <input
                        type="time"
                        value={row.startTime}
                        onChange={(e) => handleRowChange(idx, "startTime", e.target.value)}
                        className="w-full border border-zinc-200 rounded p-1 text-xs focus:outline-none"
                        required
                      />
                    </td>
                    <td className="p-2 border-r">
                      <input
                        type="time"
                        value={row.endTime}
                        onChange={(e) => handleRowChange(idx, "endTime", e.target.value)}
                        className="w-full border border-zinc-200 rounded p-1 text-xs focus:outline-none"
                        required
                      />
                    </td>
                    <td className="p-2 border-r text-right font-extrabold text-xs text-zinc-700 bg-zinc-50/40">
                      {row.hours.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={rows.length === 1}
                        className="text-red-500 hover:text-red-700 disabled:opacity-30 focus:outline-none"
                      >
                        <Trash2 className="h-4 w-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Anticipated Hours Display */}
          <div className="flex justify-end items-center gap-3 pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
              Anticipated Number of Overtime Hours:
            </span>
            <div className="w-28 h-10 border border-zinc-200 bg-zinc-100 rounded flex items-center justify-end px-4 text-sm font-extrabold text-zinc-900 select-none shadow-inner">
              {anticipatedHours.toFixed(2)}
            </div>
          </div>
        </div>

        {/* SECTION 3: EXPLANATION TEXT AREA */}
        <div className="space-y-2 border-t pt-4">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-600 block">
            3. Explanation of work requiring more than 40 hours/week to complete
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={4}
            className="w-full border border-zinc-300 rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="Please detail the project, maintenance, or operations task driving this overtime demand..."
            required
          />
        </div>

        {/* SECTION 4: SIGNATURES & APPROVALS (READ-ONLY PREVIEW) */}
        <div className="space-y-4 border-t pt-4 bg-zinc-50/50 p-4 rounded border border-zinc-200 shadow-inner">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
            Internal Validation & Sign-Offs (Workflow Status)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-zinc-600">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400">Supervisor Signature</span>
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
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400">HR Representative Signature</span>
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

        {/* DECLARATION CHECKBOX */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="declaration"
              checked={declaration}
              onChange={(e) => setDeclaration(e.target.checked)}
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
                onChange={(e) => setSignature(e.target.value)}
                className="w-full h-10 border border-zinc-300 rounded px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-semibold"
                placeholder="Type your full name to sign"
                required
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="border-t pt-6">
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-zinc-950 font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded shadow transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" /> Submit Overtime Request
          </button>
        </div>

      </form>

      {/* Footer Instructions Notice */}
      <div className="mt-8 border-t pt-4 text-[10px] leading-relaxed text-zinc-400 uppercase tracking-wider space-y-1 border-dashed">
        <p>• In the event of an emergency, the form must be completed within the week of the overtime worked.</p>
        <p>• It is the responsibility of the employee to submit a signed timesheet before payroll is completed.</p>
      </div>

    </div>
  );
};


