import React, { useMemo } from "react";
import { useOvertime } from "@/lib/overtime/store";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { BarChart3, Clock, Coins, UserCheck, AlertTriangle } from "lucide-react";

export const ManagementDashboard: React.FC = () => {
  const { requests, employees, multipliers } = useOvertime();

  // 1. KPI Aggregates
  const stats = useMemo(() => {
    let hours = 0;
    let cost = 0;
    let staffHours = 0;
    let contractHours = 0;
    let pending = 0;

    requests.forEach(r => {
      if (r.status === "Approved" || r.status === "Paid") {
        r.rows.forEach(row => {
          hours += row.hours;
          
          const mult = multipliers[row.overtimeType] || 1.0;
          const recordCost = row.hours * mult * r.hourlyRate;
          cost += recordCost;

          if (r.category === "Senior Staff" || r.category === "Junior Staff") {
            staffHours += row.hours;
          } else {
            contractHours += row.hours;
          }
        });
      } else if (r.status === "Pending") {
        pending++;
      }
    });

    return { hours, cost, staffHours, contractHours, pending };
  }, [requests, multipliers]);

  // 2. Chart 1 Data: Monthly Trends
  const monthlyData = useMemo(() => {
    const months = ["04", "05", "06"];
    const monthNames = ["April 2026", "May 2026", "June 2026"];

    return months.map((m, idx) => {
      const approved = requests.filter(r => (r.status === "Approved" || r.status === "Paid") && r.dateCompleted.includes(`-` + m + `-`));
      let hours = 0;
      let cost = 0;

      approved.forEach(r => {
        r.rows.forEach(row => {
          hours += row.hours;
          const mult = multipliers[row.overtimeType] || 1.0;
          cost += row.hours * mult * r.hourlyRate;
        });
      });

      return {
        month: monthNames[idx],
        Hours: Math.round(hours * 10) / 10,
        Cost: Math.round(cost)
      };
    });
  }, [requests, multipliers]);

  // 3. Chart 2 Data: Department Cost Share
  const deptsData = useMemo(() => {
    const depts = ["Operations", "Logistics", "Maintenance", "HR", "Finance", "Safety", "Sales"];
    return depts.map(d => {
      const approved = requests.filter(r => (r.status === "Approved" || r.status === "Paid") && r.department === d);
      let cost = 0;

      approved.forEach(r => {
        r.rows.forEach(row => {
          const mult = multipliers[row.overtimeType] || 1.0;
          cost += row.hours * mult * r.hourlyRate;
        });
      });

      return {
        department: d,
        Cost: Math.round(cost)
      };
    }).sort((a, b) => b.Cost - a.Cost);
  }, [requests, multipliers]);

  // 4. Chart 3 Data: Categories Summary
  const categoryData = useMemo(() => {
    const categories = ["Senior Staff", "Junior Staff", "Contract Workers"];
    
    return categories.map(c => {
      const approved = requests.filter(r => (r.status === "Approved" || r.status === "Paid") && r.category === c);
      let hours = 0;
      let cost = 0;

      approved.forEach(r => {
        r.rows.forEach(row => {
          hours += row.hours;
          const mult = multipliers[row.overtimeType] || 1.0;
          cost += row.hours * mult * r.hourlyRate;
        });
      });

      return {
        type: c,
        Hours: Math.round(hours * 10) / 10,
        Cost: Math.round(cost)
      };
    });
  }, [requests, multipliers]);

  // 5. Chart 4 Data: Top Employee Earners
  const employeeData = useMemo(() => {
    return employees.map(emp => {
      const approved = requests.filter(r => (r.status === "Approved" || r.status === "Paid") && r.employeeId === emp.id);
      let cost = 0;

      approved.forEach(r => {
        r.rows.forEach(row => {
          const mult = multipliers[row.overtimeType] || 1.0;
          cost += row.hours * mult * emp.hourlyRate;
        });
      });

      return {
        name: emp.name,
        Cost: Math.round(cost)
      };
    }).sort((a, b) => b.Cost - a.Cost).slice(0, 10);
  }, [requests, employees, multipliers]);

  const COLORS = ["#09090b", "#eab308", "#27272a", "#ca8a04", "#52525b", "#facc15", "#71717a"];

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left">
      
      {/* Header */}
      <div className="bg-zinc-950 border-l-4 border-l-yellow-500 p-6 rounded-xl shadow-lg border-b border-zinc-900 text-white flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6.5 w-6.5 text-yellow-500" /> Executive Management Dashboard
          </h2>
          <p className="text-xs text-yellow-400 mt-1 uppercase tracking-wider font-semibold">
            Real-time workforce utilization trends, aggregates, and financial summaries.
          </p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-zinc-400" /> Total OT Hours
          </span>
          <span className="text-2xl font-extrabold text-zinc-900 mt-2">
            {stats.hours.toFixed(1)}
          </span>
          <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Approved logs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Coins className="h-3.5 w-3.5 text-zinc-400" /> Total OT Cost
          </span>
          <span className="text-2xl font-extrabold text-zinc-900 mt-2">
            GHS {Math.round(stats.cost).toLocaleString()}
          </span>
          <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Approved gross</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <UserCheck className="h-3.5 w-3.5 text-zinc-400" /> Staff OT Hours
          </span>
          <span className="text-2xl font-extrabold text-zinc-900 mt-2">
            {stats.staffHours.toFixed(1)}
          </span>
          <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Permanent staff</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <UserCheck className="h-3.5 w-3.5 text-zinc-400" /> Contract Hours
          </span>
          <span className="text-2xl font-extrabold text-zinc-900 mt-2">
            {stats.contractHours.toFixed(1)}
          </span>
          <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Contract workers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" /> Pending Approvals
          </span>
          <span className="text-2xl font-extrabold text-yellow-600 mt-2">
            {stats.pending}
          </span>
          <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Awaiting review</span>
        </div>

      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 1: Monthly Trends */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 border-b pb-1.5">
            1. Monthly Hours vs Cost Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />
                <XAxis dataKey="month" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis yAxisId="left" stroke="#1B365D" fontSize={10} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#eab308" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconSize={8} />
                <Line yAxisId="left" type="monotone" dataKey="Hours" stroke="#09090b" strokeWidth={2} name="OT Hours" activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="Cost" stroke="#eab308" strokeWidth={2} name="OT Cost (GHS)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Department Share */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 border-b pb-1.5">
            2. Approved OT Cost by Department (GHS)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptsData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />
                <XAxis type="number" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis dataKey="department" type="category" stroke="#71717A" fontSize={10} tickLine={false} width={80} />
                <Tooltip formatter={(value) => `GHS ${value}`} />
                <Bar dataKey="Cost" radius={[0, 4, 4, 0]}>
                  {deptsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 3: Staff vs Contractors */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 border-b pb-1.5">
            3. OT Distribution: Staff vs Contractors
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />
                <XAxis dataKey="type" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconSize={8} />
                <Bar dataKey="Hours" fill="#09090b" name="Approved Hours" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cost" fill="#eab308" name="Approved Cost (GHS)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Top Employee Earners */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 border-b pb-1.5">
            4. Top 10 Employees: Approved Overtime Spend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeeData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />
                <XAxis type="number" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#71717A" fontSize={10} tickLine={false} width={100} />
                <Tooltip formatter={(value) => `GHS ${value}`} />
                <Bar dataKey="Cost" fill="#eab308" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
