# Ghacem Overtime Portal

A secure, centralized multi-portal web application built to streamline overtime request submission, manager approval workflow, and HR/Accounts auditing for Ghacem operations.

---

## 🌟 Key Features

### 1. Multi-Portal Workspaces (Isolated Modules)
* **Employee Portal (Public)**: Dedicated route at `/`. Contains only the timesheet request form. Isolated from administrative controls to ensure maximum security.
* **Supervisor Portal (Private)**: Dedicated route at `/supervisor`. Protected workflow for department managers to view pending overtime requests, enter reviews, and approve/reject timesheets.
* **HR & Accounts Portal (Private)**: Dedicated route at `/hr-accounts`. Compliance ledger audits, payroll calculations, and executive KPI analytics.

### 2. Windows Active Directory (AD) Sign-In Replica
* Real-world simulation of enterprise **Microsoft Azure AD / Windows Sign-in** authentication.
* Restricts access to Supervisor and HR/Accounts portals using corporate credentials.
* Includes dynamic header session controls allowing independent login states for each workspace.

### 3. HR Overtime Hours Adjustment
* Allows HR and Accounting personnel to modify overtime hours directly within the expanded details of the audit ledger.
* Recalculates total hours, permanent/contractor payroll calculations, gross/net pay, and tax withholding in real-time.

---

## 🔑 Test Credentials (Active Directory Replica)

Use the built-in **"Autofill AD"** shortcut on the sign-in cards, or enter the credentials below manually:

### Supervisor Portal
* **Email**: `s.hanson@company.com`
* **Password**: `WindowsPassword123!`

### HR & Accounts Portal
* **Email**: `e.asare@company.com`
* **Password**: `WindowsPassword123!`

---

## 🛠️ Technology Stack

* **Framework**: React 18, Vite, TanStack Router (TanStack Start)
* **Styling**: Tailwind CSS + Shadcn UI
* **State Management**: React Context (Global localStorage synchronized)
* **Icons & Charts**: Lucide React + Recharts (KPI visualization)

---

## 🚀 Development & Running Locally

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Installation
Install project dependencies:
```bash
npm install
```

### 3. Run Development Server
Start the local hot-reloading development server:
```bash
npm run dev
```
Open `http://localhost:8080` in your web browser.

### 4. Build Production Bundle
Build and compile the application for production:
```bash
npm run build
```

---

## 📁 Repository Structure

* `src/routes/index.tsx` - Standalone Employee Portal page (`/`).
* `src/routes/supervisor.tsx` - Dedicated Supervisor Portal page (`/supervisor`).
* `src/routes/hr-accounts.tsx` - Dedicated HR & Accounts Portal page (`/hr-accounts`).
* `src/components/overtime/ActiveDirectoryLogin.tsx` - Shared corporate Active Directory sign-in.
* `src/components/overtime/AdminHeader.tsx` - Admin top navigation tabs linking `/supervisor` and `/hr-accounts`.
* `src/components/overtime/RequestForm.tsx` - Employee timesheet submission form.
* `src/components/overtime/ApprovalCenter.tsx` - Supervisor approvals queue.
* `src/components/overtime/HRDashboard.tsx` - HR Overtime Audit ledger (includes hours adjustments).
* `src/components/overtime/PayrollDashboard.tsx` - Accounting payroll calculator.
* `src/components/overtime/ManagementDashboard.tsx` - Executive KPI analytics dashboard.
* `src/lib/overtime/store.tsx` - State provider, default employee database, and business math logic.
