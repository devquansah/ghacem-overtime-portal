import React, { createContext, useContext, useState, useEffect } from "react";

export interface Employee {
  id: string;
  name: string;
  category: "Senior Staff" | "Junior Staff" | "Contract Workers";
  department: string;
  role: string;
  hourlyRate: number;
  managerEmail: string;
}

export interface OvertimeRow {
  date: string;
  overtimeType: "Weekday" | "Public holiday" | "Emergency";
  startTime: string;
  endTime: string;
  hours: number;
}

export interface OvertimeRequest {
  id: string;
  dateCompleted: string;
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  department: string;
  supervisor: string;
  hourlyRate: number;
  category: "Senior Staff" | "Junior Staff" | "Contract Workers";
  rows: OvertimeRow[];
  totalHours: number;
  explanation: string;
  status: "Pending" | "Approved" | "Rejected" | "Paid";
  approvedBy: string;
  dateApproved: string;
  comments: string;
  signature: string;
}

interface OvertimeContextType {
  requests: OvertimeRequest[];
  employees: Employee[];
  multipliers: { [key: string]: number };
  maxMonthlyHours: number;
  withholdingTax: number;
  payeTax: number;
  submitRequest: (request: Omit<OvertimeRequest, "id" | "status" | "approvedBy" | "dateApproved" | "comments">) => string;
  approveRequest: (id: string, approverName: string, comments: string) => void;
  rejectRequest: (id: string, approverName: string, comments: string) => void;
  updateRequestHours: (id: string, rows: OvertimeRow[], totalHours: number) => void;
  markRequestAsPaid: (id: string) => void;
  importRequests: (imported: OvertimeRequest[]) => void;
  resetAllData: () => void;
  refreshData: () => void;
}

const OvertimeContext = createContext<OvertimeContextType | undefined>(undefined);

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'EMP001', name: 'Kwame Mensah', category: 'Senior Staff', department: 'Operations', role: 'Shift Supervisor', hourlyRate: 45.00, managerEmail: 'k.mensah@ghacem.com' },
  { id: 'EMP002', name: 'Abena Osei', category: 'Senior Staff', department: 'Operations', role: 'Control Operator', hourlyRate: 50.00, managerEmail: 'k.mensah@ghacem.com' },
  { id: 'EMP003', name: 'Yaw Addo', category: 'Junior Staff', department: 'Logistics', role: 'Fleet Dispatcher', hourlyRate: 42.00, managerEmail: 'c.oppong@ghacem.com' },
  { id: 'EMP004', name: 'Ekow Gyan', category: 'Senior Staff', department: 'Maintenance', role: 'Senior Technician', hourlyRate: 48.00, managerEmail: 'a.taylor@ghacem.com' },
  { id: 'EMP005', name: 'Efua Asare', category: 'Junior Staff', department: 'HR', role: 'HR Officer', hourlyRate: 40.00, managerEmail: 's.hanson@ghacem.com' },
  { id: 'EMP006', name: 'Kojo Peprah', category: 'Senior Staff', department: 'Finance', role: 'Accountant', hourlyRate: 55.00, managerEmail: 's.hanson@ghacem.com' },
  { id: 'EMP007', name: 'Yaa Baah', category: 'Junior Staff', department: 'Safety', role: 'Safety Officer', hourlyRate: 46.00, managerEmail: 'a.taylor@ghacem.com' },
  { id: 'EMP008', name: 'Kwaku Mensah', category: 'Junior Staff', department: 'Operations', role: 'Quarry Operator', hourlyRate: 38.00, managerEmail: 'k.mensah@ghacem.com' },
  { id: 'EMP009', name: 'Adjoa Sarfo', category: 'Senior Staff', department: 'Logistics', role: 'Warehouse Sup', hourlyRate: 44.00, managerEmail: 'c.oppong@ghacem.com' },
  { id: 'EMP010', name: 'Kofi Boateng', category: 'Senior Staff', department: 'Maintenance', role: 'Electrical Eng', hourlyRate: 52.00, managerEmail: 'a.taylor@ghacem.com' },
  { id: 'CON001', name: 'Emmanuel Boateng', category: 'Contract Workers', department: 'Operations', role: 'Packing Helper', hourlyRate: 35.00, managerEmail: 'kwame.mensah@ghacem.com' },
  { id: 'CON002', name: 'Kofi Antwi', category: 'Contract Workers', department: 'Operations', role: 'Driver', hourlyRate: 32.00, managerEmail: 'kwame.mensah@ghacem.com' },
  { id: 'CON003', name: 'Ama Serwaa', category: 'Contract Workers', department: 'Logistics', role: 'Loader', hourlyRate: 30.00, managerEmail: 'y.addo@ghacem.com' },
  { id: 'CON004', name: 'Kwabena Kyeremeh', category: 'Contract Workers', department: 'Maintenance', role: 'Mechanic', hourlyRate: 36.00, managerEmail: 'e.gyan@ghacem.com' },
  { id: 'CON005', name: 'John Mensah', category: 'Contract Workers', department: 'Safety', role: 'Fire Marshall', hourlyRate: 33.00, managerEmail: 'y.baah@ghacem.com' }
];

const MULTIPLIERS = {
  Weekday: 1.5,
  "Public holiday": 2.5,
  Emergency: 3.0
};

const MAX_MONTHLY_HOURS = 40;
const WITHHOLDING_TAX = 0.075; // 7.5%
const PAYE_TAX = 0.15; // 15%

export const parseTimeStringToDecimal = (timeStr: string): number => {
  if (!timeStr) return 0;
  // Clean the string (remove spaces, etc.)
  const cleaned = timeStr.trim().replace(/\s/g, "");
  // Match HH:MM or HH.MM or HH
  const match = cleaned.match(/^(\d{1,2})[:.]?(\d{2})?$/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    return hours + minutes / 60;
  }
  // Fallback: try parsing as float directly
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
};

// Helper to calculate hours supporting up to 48 hours and continuous formats
export const calculateRowHours = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  try {
    const startDec = parseTimeStringToDecimal(startTime);
    const endDec = parseTimeStringToDecimal(endTime);
    
    let diff = endDec - startDec;
    if (diff < 0) {
      // Crossed midnight boundary and typed standard 24-hr time
      diff += 24;
    } else if (diff === 0) {
      // Equal start and end times represent exactly 24 hours
      diff = 24;
    }
    return Math.round(diff * 100) / 100;
  } catch (e) {
    return 0;
  }
};

export const OvertimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("ghacem_overtime_requests");
    if (stored) {
      setRequests(JSON.parse(stored));
    } else {
      const mockDb: OvertimeRequest[] = [
        {
          id: "OT-2026-00001", dateCompleted: "2026-04-02", employeeId: "EMP001", employeeName: "Kwame Mensah",
          jobTitle: "Shift Supervisor", department: "Operations", supervisor: "Sarah Hanson", hourlyRate: 45.00,
          category: "Senior Staff", totalHours: 4.0, explanation: "Extended shift for kiln repair",
          status: "Approved", approvedBy: "Sarah Hanson", dateApproved: "2026-04-03", comments: "Valid kiln maintenance cover.",
          signature: "Kwame Mensah", rows: [{ date: "2026-04-02", overtimeType: "Weekday", startTime: "18:00", endTime: "22:00", hours: 4.0 }]
        },
        {
          id: "OT-2026-00002", dateCompleted: "2026-04-03", employeeId: "EMP002", employeeName: "Abena Osei",
          jobTitle: "Control Operator", department: "Operations", supervisor: "Sarah Hanson", hourlyRate: 50.00,
          category: "Senior Staff", totalHours: 3.0, explanation: "Late billing reconciliation",
          status: "Approved", approvedBy: "Sarah Hanson", dateApproved: "2026-04-04", comments: "Approved reconciliation work.",
          signature: "Abena Osei", rows: [{ date: "2026-04-03", overtimeType: "Weekday", startTime: "17:00", endTime: "20:00", hours: 3.0 }]
        },
        {
          id: "OT-2026-00003", dateCompleted: "2026-04-04", employeeId: "CON001", employeeName: "Emmanuel Boateng",
          jobTitle: "Packing Helper", department: "Operations", supervisor: "Kwame Mensah", hourlyRate: 35.00,
          category: "Contract Workers", totalHours: 6.0, explanation: "Silo clearing support",
          status: "Approved", approvedBy: "Kwame Mensah", dateApproved: "2026-04-04", comments: "Completed weekend packing duty.",
          signature: "Emmanuel Boateng", rows: [{ date: "2026-04-04", overtimeType: "Public holiday", startTime: "08:00", endTime: "14:00", hours: 6.0 }]
        },
        {
          id: "OT-2026-00004", dateCompleted: "2026-04-05", employeeId: "CON002", employeeName: "Kofi Antwi",
          jobTitle: "Driver", department: "Operations", supervisor: "Kwame Mensah", hourlyRate: 32.00,
          category: "Contract Workers", totalHours: 8.0, explanation: "Emergency raw material delivery",
          status: "Approved", approvedBy: "Kwame Mensah", dateApproved: "2026-04-05", comments: "Urgent dispatch completed.",
          signature: "Kofi Antwi", rows: [{ date: "2026-04-05", overtimeType: "Weekday", startTime: "08:00", endTime: "16:00", hours: 8.0 }]
        },
        {
          id: "OT-2026-00005", dateCompleted: "2026-04-07", employeeId: "EMP004", employeeName: "Ekow Gyan",
          jobTitle: "Senior Technician", department: "Maintenance", supervisor: "Albert Taylor", hourlyRate: 48.00,
          category: "Senior Staff", totalHours: 5.0, explanation: "Electrical fault in clinker cooler",
          status: "Approved", approvedBy: "Albert Taylor", dateApproved: "2026-04-08", comments: "Plant safety restoration.",
          signature: "Ekow Gyan", rows: [{ date: "2026-04-07", overtimeType: "Emergency", startTime: "20:00", endTime: "01:00", hours: 5.0 }]
        },
        {
          id: "OT-2026-04-010", dateCompleted: "2026-04-15", employeeId: "EMP008", employeeName: "Kwaku Mensah",
          jobTitle: "Quarry Operator", department: "Operations", supervisor: "Kofi Mensah", hourlyRate: 38.00,
          category: "Junior Staff", totalHours: 4.0, explanation: "Unapproved overtime extension",
          status: "Rejected", approvedBy: "Kofi Mensah", dateApproved: "2026-04-16", comments: "Was not pre-authorized.",
          signature: "Kwaku Mensah", rows: [{ date: "2026-04-15", overtimeType: "Weekday", startTime: "17:00", endTime: "21:00", hours: 4.0 }]
        },
        {
          id: "OT-2026-00023", dateCompleted: "2026-05-27", employeeId: "EMP008", employeeName: "Kwaku Mensah",
          jobTitle: "Quarry Operator", department: "Operations", supervisor: "Kofi Mensah", hourlyRate: 38.00,
          category: "Junior Staff", totalHours: 5.0, explanation: "Extra kiln support",
          status: "Pending", approvedBy: "", dateApproved: "", comments: "",
          signature: "Kwaku Mensah", rows: [{ date: "2026-05-27", overtimeType: "Weekday", startTime: "18:00", endTime: "23:00", hours: 5.0 }]
        },
        {
          id: "OT-2026-00038", dateCompleted: "2026-06-14", employeeId: "EMP001", employeeName: "Kwame Mensah",
          jobTitle: "Shift Supervisor", department: "Operations", supervisor: "Kofi Mensah", hourlyRate: 45.00,
          category: "Senior Staff", totalHours: 8.0, explanation: "Kiln monitoring weekend shift",
          status: "Pending", approvedBy: "", dateApproved: "", comments: "",
          signature: "Kwame Mensah", rows: [{ date: "2026-06-14", overtimeType: "Public holiday", startTime: "08:00", endTime: "16:00", hours: 8.0 }]
        },
        {
          id: "OT-2026-00040", dateCompleted: "2026-06-15", employeeId: "CON001", employeeName: "Emmanuel Boateng",
          jobTitle: "Packing Helper", department: "Operations", supervisor: "Kwame Mensah", hourlyRate: 35.00,
          category: "Contract Workers", totalHours: 4.0, explanation: "Late cleaning after shift close",
          status: "Pending", approvedBy: "", dateApproved: "", comments: "",
          signature: "Emmanuel Boateng", rows: [{ date: "2026-06-15", overtimeType: "Weekday", startTime: "18:00", endTime: "22:00", hours: 4.0 }]
        }
      ];
      localStorage.setItem("ghacem_overtime_requests", JSON.stringify(mockDb));
      setRequests(mockDb);
    }
  }, []);

  // Sync state in real-time across tabs/windows when localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ghacem_overtime_requests" && e.newValue) {
        try {
          setRequests(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse sync storage requests", err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const refreshData = () => {
    const stored = localStorage.getItem("ghacem_overtime_requests");
    if (stored) {
      try {
        setRequests(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse refresh storage requests", err);
      }
    }
  };

  const submitRequest = (newReq: Omit<OvertimeRequest, "id" | "status" | "approvedBy" | "dateApproved" | "comments">): string => {
    const nextNum = requests.length + 1;
    const padNum = String(nextNum).padStart(5, '0');
    const id = `OT-2026-${padNum}`;
    
    const record: OvertimeRequest = {
      ...newReq,
      id,
      status: "Pending",
      approvedBy: "",
      dateApproved: "",
      comments: ""
    };

    const updated = [record, ...requests];
    setRequests(updated);
    localStorage.setItem("ghacem_overtime_requests", JSON.stringify(updated));
    return id;
  };

  const approveRequest = (id: string, approverName: string, comments: string) => {
    const updated = requests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: "Approved" as const,
          approvedBy: approverName,
          dateApproved: new Date().toISOString().split('T')[0],
          comments: comments || "Approved via Web Portal Console."
        };
      }
      return r;
    });
    setRequests(updated);
    localStorage.setItem("ghacem_overtime_requests", JSON.stringify(updated));
  };

  const rejectRequest = (id: string, approverName: string, comments: string) => {
    const updated = requests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: "Rejected" as const,
          approvedBy: approverName,
          dateApproved: new Date().toISOString().split('T')[0],
          comments: comments || "Rejected - lacked authorized context."
        };
      }
      return r;
    });
    setRequests(updated);
    localStorage.setItem("ghacem_overtime_requests", JSON.stringify(updated));
  };

  const updateRequestHours = (id: string, updatedRows: OvertimeRow[], totalHours: number) => {
    const updated = requests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          rows: updatedRows,
          totalHours
        };
      }
      return r;
    });
    setRequests(updated);
    localStorage.setItem("ghacem_overtime_requests", JSON.stringify(updated));
  };

  const markRequestAsPaid = (id: string) => {
    const updated = requests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: "Paid" as const
        };
      }
      return r;
    });
    setRequests(updated);
    localStorage.setItem("ghacem_overtime_requests", JSON.stringify(updated));
  };

  const importRequests = (imported: OvertimeRequest[]) => {
    const importedIds = new Set(imported.map(r => r.id));
    const keptRequests = requests.filter(r => !importedIds.has(r.id));
    const merged = [...imported, ...keptRequests];
    setRequests(merged);
    localStorage.setItem("ghacem_overtime_requests", JSON.stringify(merged));
  };

  const resetAllData = () => {
    localStorage.removeItem("ghacem_overtime_requests");
    window.location.reload();
  };

  return (
    <OvertimeContext.Provider value={{
      requests,
      employees: INITIAL_EMPLOYEES,
      multipliers: MULTIPLIERS,
      maxMonthlyHours: MAX_MONTHLY_HOURS,
      withholdingTax: WITHHOLDING_TAX,
      payeTax: PAYE_TAX,
      submitRequest,
      approveRequest,
      rejectRequest,
      updateRequestHours,
      markRequestAsPaid,
      importRequests,
      resetAllData,
      refreshData
    }}>
      {children}
    </OvertimeContext.Provider>
  );
};

export const useOvertime = () => {
  const context = useContext(OvertimeContext);
  if (!context) {
    throw new Error("useOvertime must be used within a OvertimeProvider");
  }
  return context;
};
