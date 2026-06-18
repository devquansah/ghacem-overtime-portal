import React, { useMemo } from "react";
import { useOvertime } from "@/lib/overtime/store";
import { ShieldAlert, Receipt, CircleDollarSign } from "lucide-react";

export const PayrollDashboard: React.FC = () => {
  const { requests, employees, multipliers, maxMonthlyHours, withholdingTax, payeTax } = useOvertime();

  // Aggregate approved records for each employee (configured for June 2026)
  const payrollData = useMemo(() => {
    return employees.map(emp => {
      // Find all approved requests for this employee in June 2026
      const approvedReqs = requests.filter(r => 
        r.employeeId === emp.id && 
        r.status === "Approved" &&
        r.dateCompleted.startsWith("2026-06")
      );

      // Sum hours and pay
      const totalHours = approvedReqs.reduce((sum, r) => sum + r.totalHours, 0);
      
      const totalPay = approvedReqs.reduce((sum, r) => {
        const mult = multipliers[r.overtimeType] || 1.0;
        return sum + (r.totalHours * mult * emp.hourlyRate);
      }, 0);

      const taxRate = emp.category === "Contract Workers" ? withholdingTax : payeTax;
      const taxDeduction = totalPay * taxRate;
      const netPay = totalPay - taxDeduction;

      return {
        id: emp.id,
        name: emp.name,
        category: emp.category,
        department: emp.department,
        rate: emp.hourlyRate,
        hours: totalHours,
        gross: totalPay,
        taxRate,
        taxDeduction,
        net: netPay
      };
    });
  }, [requests, employees, multipliers, withholdingTax, payeTax]);

  // Sum aggregates for bottom total row
  const totals = useMemo(() => {
    return payrollData.reduce((acc, curr) => {
      acc.hours += curr.hours;
      acc.gross += curr.gross;
      acc.taxDeduction += curr.taxDeduction;
      acc.net += curr.net;
      return acc;
    }, { hours: 0, gross: 0, taxDeduction: 0, net: 0 });
  }, [payrollData]);

  // Flag compliance warnings
  const flagCount = payrollData.filter(p => p.hours > maxMonthlyHours).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-6 rounded-xl shadow-lg border-b border-indigo-900 text-white flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6.5 w-6.5" /> Payroll Overtime summary & tax ledger
          </h2>
          <p className="text-xs text-indigo-50 mt-1 uppercase tracking-wider font-semibold">
            Reconciliation worksheet for June 2026: calculates PAYE tax, contractor withholding, and net payrolls.
          </p>
        </div>
      </div>

      {/* Safety Compliance Alert */}
      {flagCount > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-800 shadow-sm text-left">
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
                <th className="py-3.5 px-3 w-[18%]">Full Name</th>
                <th className="py-3.5 px-3 w-[12%] text-center">Staff Type</th>
                <th className="py-3.5 px-3 w-[12%]">Department</th>
                <th className="py-3.5 px-3 w-[10%] text-right">Hourly Rate</th>
                <th className="py-3.5 px-3 w-[12%] text-right">Approved Hours</th>
                <th className="py-3.5 px-3 w-[14%] text-right">Gross OT Pay (GHS)</th>
                <th className="py-3.5 px-3 w-[8%] text-right">Tax Rate</th>
                <th className="py-3.5 px-3 w-[12%] text-right">Tax Deduction</th>
                <th className="py-3.5 px-3 w-[14%] text-right">Net OT Pay (GHS)</th>
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
                          ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}>
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{p.department}</td>
                    <td className="p-3 text-right">GHS {p.rate.toFixed(2)}</td>
                    <td className={`p-3 text-right font-extrabold ${limitExceeded ? "text-red-600 font-extrabold" : ""}`}>
                      {p.hours.toFixed(2)} {limitExceeded && "⚠️"}
                    </td>
                    <td className="p-3 text-right text-zinc-900">GHS {p.gross.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right text-zinc-500">{(p.taxRate * 100).toFixed(1)}%</td>
                    <td className="p-3 text-right text-red-600">-GHS {p.taxDeduction.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-extrabold text-zinc-900 bg-zinc-50/40">GHS {p.net.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
              
              {/* TOTALS ROW */}
              <tr className="bg-zinc-100 font-extrabold text-zinc-900 border-t border-t-zinc-300">
                <td colSpan={5} className="p-4 text-right uppercase tracking-wider text-[10px]">Total Approved:</td>
                <td className="p-4 text-right font-extrabold">{totals.hours.toFixed(2)}</td>
                <td className="p-4 text-right text-zinc-950">GHS {totals.gross.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-4 bg-zinc-100"></td>
                <td className="p-4 text-right text-red-700">-GHS {totals.taxDeduction.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-4 text-right text-zinc-950 bg-zinc-200/50">GHS {totals.net.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};
