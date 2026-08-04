import React, { useMemo, useRef } from "react";
import { useOvertime } from "@/lib/overtime/store";
import { ShieldAlert, Download, Upload, Printer } from "lucide-react";
import { toast } from "sonner";

export const PayrollDashboard: React.FC = () => {
  const { requests, employees, multipliers, maxMonthlyHours, importRequests } = useOvertime();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aggregate approved or paid records for each employee (configured for June 2026)
  const payrollData = useMemo(() => {
    return employees.map(emp => {
      // Find all approved or paid requests for this employee in June 2026
      const approvedReqs = requests.filter(r => 
        r.employeeId === emp.id && 
        (r.status === "Approved" || r.status === "Paid") &&
        r.dateCompleted.startsWith("2026-06")
      );

      // Sum hours and pay based on row-level actHours and multipliers
      let totalHours = 0;
      let totalPay = 0;

      approvedReqs.forEach(r => {
        r.rows.forEach(row => {
          const hrs = row.actHours ?? row.hours ?? 0;
          totalHours += hrs;
          const mult = multipliers[row.overtimeType] || 1.0;
          totalPay += hrs * mult * emp.hourlyRate;
        });
      });

      return {
        id: emp.id,
        name: emp.name,
        category: emp.category,
        department: emp.department,
        rate: emp.hourlyRate,
        hours: totalHours,
        pay: totalPay
      };
    });
  }, [requests, employees, multipliers]);

  // Sum aggregates for bottom total row
  const totals = useMemo(() => {
    return payrollData.reduce((acc, curr) => {
      acc.hours += curr.hours;
      acc.pay += curr.pay;
      return acc;
    }, { hours: 0, pay: 0 });
  }, [payrollData]);

  // Flag compliance warnings
  const flagCount = payrollData.filter(p => p.hours > maxMonthlyHours).length;

  // CSV Export Handler
  const handleExportCSV = () => {
    try {
      const headers = [
        "Employee ID",
        "Full Name",
        "Staff Type",
        "Department",
        "Hourly Rate (GHS)",
        "Approved Hours",
        "OT Pay (GHS)"
      ];

      const csvRows = payrollData.map(p => [
        p.id,
        p.name,
        p.category,
        p.department,
        p.rate.toFixed(2),
        p.hours.toFixed(2),
        p.pay.toFixed(2)
      ]);

      // Add totals row
      csvRows.push([
        "TOTALS",
        "",
        "",
        "",
        "",
        totals.hours.toFixed(2),
        totals.pay.toFixed(2)
      ]);

      const csvContent = [
        headers.join(","),
        ...csvRows.map(row => row.map(val => `"${val}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ghacem_payroll_summary_june_2026.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV file exported successfully!");
    } catch (e) {
      toast.error("Failed to export CSV.");
    }
  };

  // JSON Backup Sheet Export (very useful for backups and re-importing)
  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify(requests, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ghacem_overtime_requests_backup.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("JSON backup exported successfully!");
    } catch (e) {
      toast.error("Failed to export JSON.");
    }
  };

  // JSON Import Handler
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!Array.isArray(imported)) {
          toast.error("Import failed: JSON file must contain an array of requests.");
          return;
        }
        
        // Simple schema verification
        if (imported.length > 0 && (!imported[0].id || !imported[0].employeeName)) {
          toast.error("Import failed: Invalid data schema.");
          return;
        }

        importRequests(imported);
        toast.success(`Successfully imported ${imported.length} overtime request records!`);
        
        // Reset file input value
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        toast.error("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 print-container">
      
      {/* Dynamic CSS styles for print mode */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, footer, nav, button, select, input, .no-print, [role="tablist"] {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
            box-shadow: none !important;
            border: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            font-size: 10px !important;
          }
          th, td {
            border: 1px solid #d4d4d8 !important;
            padding: 6px 8px !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Header Banner - Ghacem Black & Yellow */}
      <div className="bg-zinc-950 p-6 rounded-xl shadow-lg border-l-4 border-l-yellow-500 text-white flex items-center justify-between flex-wrap gap-4 print-container">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Payroll Overtime summary ledger
          </h2>
        </div>

        {/* TOOLBAR CONTROLS - Hidden in Print */}
        <div className="flex gap-2 no-print">
          
          {/* Import JSON button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-yellow-500 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            title="Import JSON Backup file"
          >
            <Upload className="h-3.5 w-3.5" /> Import JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-yellow-500 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            title="Export summary to CSV"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>

          {/* Backup JSON */}
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-yellow-500 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            title="Backup all records to JSON"
          >
            <Download className="h-3.5 w-3.5" /> Backup JSON
          </button>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-zinc-950 font-extrabold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            title="Open browser print preview"
          >
            <Printer className="h-3.5 w-3.5 text-zinc-950" /> Print Summary
          </button>
          
        </div>
      </div>

      {/* Safety Compliance Alert */}
      {flagCount > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-800 shadow-sm text-left no-print">
          <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider">Overtime Hours Safety Breach</h4>
            <p className="text-xs mt-1 font-medium leading-normal">
              Warning: <b>{flagCount}</b> employee(s) exceeded the configured legal overtime limit of <b>{maxMonthlyHours} hours</b> this month. Please audit and confirm prior authorization.
            </p>
          </div>
        </div>
      )}

      {/* PAYROLL GRID */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-100 border-b text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-3 w-[12%]">Employee ID</th>
                <th className="py-3.5 px-3 w-[22%]">Full Name</th>
                <th className="py-3.5 px-3 w-[14%] text-center">Staff Type</th>
                <th className="py-3.5 px-3 w-[16%]">Department</th>
                <th className="py-3.5 px-3 w-[12%] text-right">Hourly Rate</th>
                <th className="py-3.5 px-3 w-[12%] text-right">Approved Hours</th>
                <th className="py-3.5 px-3 w-[12%] text-right">OT Pay (GHS)</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.map(p => {
                const limitExceeded = p.hours > maxMonthlyHours;
                return (
                  <tr
                    key={p.id}
                    className={`border-b last:border-b-0 hover:bg-zinc-50/50 transition-colors font-semibold text-zinc-700 ${
                      limitExceeded ? "bg-red-50/20" : ""
                    }`}
                  >
                    <td className="p-3 font-extrabold text-zinc-900">{p.id}</td>
                    <td className="p-3 font-bold text-zinc-950">{p.name}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold rounded border ${
                        p.category === "Contract Workers"
                          ? "bg-slate-50 text-slate-600 border-slate-200"
                          : p.category === "Senior Staff"
                          ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                          : "bg-zinc-50 text-zinc-800 border-zinc-200"
                      }`}>
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{p.department}</td>
                    <td className="p-3 text-right">GHS {p.rate.toFixed(2)}</td>
                    <td className={`p-3 text-right font-extrabold ${limitExceeded ? "text-red-600 font-extrabold" : ""}`}>
                      {p.hours.toFixed(2)} {limitExceeded && "⚠️"}
                    </td>
                    <td className="p-3 text-right font-extrabold text-zinc-900 bg-zinc-50/40">GHS {p.pay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
              
              {/* TOTALS ROW */}
              <tr className="bg-zinc-100 font-extrabold text-zinc-900 border-t border-t-zinc-300">
                <td colSpan={5} className="p-4 text-right uppercase tracking-wider text-[10px]">Total Approved:</td>
                <td className="p-4 text-right font-extrabold">{totals.hours.toFixed(2)}</td>
                <td className="p-4 text-right text-zinc-950 bg-zinc-200/50">GHS {totals.pay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};
