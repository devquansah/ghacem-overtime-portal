const ExcelJS = require('exceljs');
const path = require('path');

async function createDashboard() {
  console.log("Starting Ghacem Overtime Dashboard generation...");
  const workbook = new ExcelJS.Workbook();
  
  // Custom Styles
  const fontName = 'Segoe UI';
  const colors = {
    navy: 'FF1B365D',      // Primary Header
    orange: 'FFE87722',    // Accent / Highlights
    charcoal: 'FF333333',  // Dark Text
    greyText: 'FF595959',  // Subtext
    lightGreyBg: 'FFF8F9FA',// Table zebra stripe or cards
    iceBlueBg: 'FFF0F4F8', // Secondary cards or highlights
    borderGrey: 'FFD9D9D9',// Regular borders
    approvedBg: 'FFE2EFDA',// Soft green
    approvedText: 'FF375623',
    pendingBg: 'FFFFF2CC', // Soft yellow/orange
    pendingText: 'FF7F6000',
    rejectedBg: 'FFFCE4D6',// Soft red
    rejectedText: 'FFC65911'
  };

  const styles = {
    titleFont: { name: fontName, size: 16, bold: true, color: { argb: 'FFFFFFFF' } },
    subtitleFont: { name: fontName, size: 11, italic: true, color: { argb: colors.greyText } },
    sectionFont: { name: fontName, size: 14, bold: true, color: { argb: colors.navy } },
    headerFont: { name: fontName, size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
    cardTitleFont: { name: fontName, size: 9, bold: true, color: { argb: colors.greyText } },
    cardValFont: { name: fontName, size: 18, bold: true, color: { argb: colors.navy } },
    regularFont: { name: fontName, size: 10, color: { argb: colors.charcoal } },
    boldFont: { name: fontName, size: 10, bold: true, color: { argb: colors.charcoal } },
    italicFont: { name: fontName, size: 9, italic: true, color: { argb: colors.greyText } },
    
    headerFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navy } },
    orangeFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.orange } },
    zebraFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.iceBlueBg } },
    cardFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightGreyBg } },
    greyHeaderFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } },
    
    thinBorder: {
      top: { style: 'thin', color: { argb: colors.borderGrey } },
      left: { style: 'thin', color: { argb: colors.borderGrey } },
      bottom: { style: 'thin', color: { argb: colors.borderGrey } },
      right: { style: 'thin', color: { argb: colors.borderGrey } }
    },
    doubleBottomBorder: {
      top: { style: 'thin', color: { argb: colors.charcoal } },
      bottom: { style: 'double', color: { argb: colors.charcoal } }
    },
    thickOutlineBorder: {
      top: { style: 'medium', color: { argb: colors.navy } },
      left: { style: 'medium', color: { argb: colors.navy } },
      bottom: { style: 'medium', color: { argb: colors.navy } },
      right: { style: 'medium', color: { argb: colors.navy } }
    }
  };

  // Helper: Create standardized Title Banner
  function createTitleBanner(ws, sheetName, totalCols) {
    // Row 2: Title
    ws.mergeCells(2, 2, 2, totalCols);
    const titleCell = ws.getCell(2, 2);
    titleCell.value = `GHACEM LTD. - ${sheetName.toUpperCase()}`;
    titleCell.font = styles.titleFont;
    titleCell.fill = styles.headerFill;
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(2).height = 40;

    // Row 3: Thin accent line
    ws.mergeCells(3, 2, 3, totalCols);
    const accentCell = ws.getCell(3, 2);
    accentCell.fill = styles.orangeFill;
    ws.getRow(3).height = 4;
  }

  // ----------------------------------------------------
  // SHEET 1: Instructions & Settings
  // ----------------------------------------------------
  const ws1 = workbook.addWorksheet('Instructions & Settings');
  ws1.views = [{ showGridLines: true }];
  createTitleBanner(ws1, 'System Instructions & Configurations', 7);

  // User Guide
  ws1.getCell('B5').value = 'User Quick-Start Guide';
  ws1.getCell('B5').font = styles.sectionFont;
  
  const guides = [
    ['1. System Purpose', 'Tracks, approves, and analyzes overtime costs and productivity for permanent and contract staff.'],
    ['2. Master Data', 'Always maintain up-to-date staff in the "Employee Master Data" sheet before logging overtime.'],
    ['3. Logging Overtime', 'Use the "Overtime Records" sheet. Enter Employee ID, and XLOOKUP will auto-fill name, department, rate, etc.'],
    ['4. Approval Control', 'Update Approval Status in Column L. Summaries only calculate "Approved" hours and costs.'],
    ['5. Analytics & Dashboard', 'The "KPI Dashboard" and "Department Analytics" recalculate in real-time based on formulas.'],
    ['6. Printable Reports', 'The "Management Report" sheet is formatted and pre-scaled for executive printing.']
  ];

  guides.forEach((g, idx) => {
    const rNum = 6 + idx;
    ws1.getCell(`B${rNum}`).value = g[0];
    ws1.getCell(`B${rNum}`).font = styles.boldFont;
    ws1.getCell(`B${rNum}`).border = styles.thinBorder;
    ws1.getCell(`B${rNum}`).fill = styles.cardFill;
    
    ws1.mergeCells(rNum, 3, rNum, 7);
    const descCell = ws1.getCell(rNum, 3);
    descCell.value = g[1];
    descCell.font = styles.regularFont;
    descCell.alignment = { wrapText: true };
    // Set borders for the merged cells
    for(let col = 3; col <= 7; col++) {
      ws1.getCell(rNum, col).border = styles.thinBorder;
    }
  });

  // Overtime Configuration Table
  ws1.getCell('B14').value = 'Overtime Multipliers Configuration';
  ws1.getCell('B14').font = styles.sectionFont;

  const configHeaders = ['Overtime Type', 'Multiplier (Multiplier)'];
  configHeaders.forEach((h, idx) => {
    const cell = ws1.getCell(15, 2 + idx);
    cell.value = h;
    cell.font = styles.headerFont;
    cell.fill = styles.headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = styles.thinBorder;
  });

  const multipliers = [
    ['Weekday', 1.5],
    ['Weekend', 2.0],
    ['Holiday', 2.5],
    ['Emergency', 3.0]
  ];

  multipliers.forEach((m, idx) => {
    const rNum = 16 + idx;
    
    const cellType = ws1.getCell(rNum, 2);
    cellType.value = m[0];
    cellType.font = styles.boldFont;
    cellType.border = styles.thinBorder;
    
    const cellMult = ws1.getCell(rNum, 3);
    cellMult.value = m[1];
    cellMult.font = styles.regularFont;
    cellMult.alignment = { horizontal: 'right' };
    cellMult.border = styles.thinBorder;
    cellMult.numFmt = '0.0"x"';
  });

  // Safety & General Threshold Configurations
  ws1.getCell('E14').value = 'System Variables';
  ws1.getCell('E14').font = styles.sectionFont;

  const varHeaders = ['Variable Description', 'Configured Value'];
  varHeaders.forEach((h, idx) => {
    const cell = ws1.getCell(15, 5 + idx);
    cell.value = h;
    cell.font = styles.headerFont;
    cell.fill = styles.headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = styles.thinBorder;
  });

  const variables = [
    ['Max Monthly OT Hours Limit', 40, '0'],
    ['Contractor Withholding Tax Rate', 0.075, '0.0%'],
    ['Staff Average PAYE Tax Rate', 0.15, '0.0%']
  ];

  variables.forEach((v, idx) => {
    const rNum = 16 + idx;
    
    const cellDesc = ws1.getCell(rNum, 5);
    cellDesc.value = v[0];
    cellDesc.font = styles.boldFont;
    cellDesc.border = styles.thinBorder;
    
    ws1.mergeCells(rNum, 5, rNum, 6);
    // Apply borders across the merge
    ws1.getCell(rNum, 6).border = styles.thinBorder;

    const cellVal = ws1.getCell(rNum, 7);
    cellVal.value = v[1];
    cellVal.font = styles.regularFont;
    cellVal.alignment = { horizontal: 'right' };
    cellVal.border = styles.thinBorder;
    cellVal.numFmt = v[2];
  });

  // Column formatting for Instructions
  ws1.getColumn('A').width = 3;
  ws1.getColumn('B').width = 25;
  ws1.getColumn('C').width = 20;
  ws1.getColumn('D').width = 20;
  ws1.getColumn('E').width = 28;
  ws1.getColumn('F').width = 12;
  ws1.getColumn('G').width = 18;

  // ----------------------------------------------------
  // SHEET 2: Employee Master Data
  // ----------------------------------------------------
  const ws2 = workbook.addWorksheet('Employee Master Data');
  createTitleBanner(ws2, 'Employee Master Database', 9);

  const empHeaders = [
    'Employee ID', 'Full Name', 'Staff Type', 'Department', 
    'Role', 'Hourly Base Rate (GHS)', 'Direct Manager', 'Email', 'Status'
  ];

  empHeaders.forEach((h, idx) => {
    const cell = ws2.getCell(5, 2 + idx);
    cell.value = h;
    cell.font = styles.headerFont;
    cell.fill = styles.headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = styles.thinBorder;
  });
  ws2.getRow(5).height = 28;

  const employees = [
    ['EMP001', 'Kwame Mensah', 'Permanent', 'Operations', 'Shift Supervisor', 45.00, 'Kofi Mensah', 'k.mensah@ghacem.com', 'Active'],
    ['EMP002', 'Abena Osei', 'Permanent', 'Operations', 'Control Operator', 50.00, 'Kofi Mensah', 'a.osei@ghacem.com', 'Active'],
    ['EMP003', 'Yaw Addo', 'Permanent', 'Logistics', 'Fleet Dispatcher', 42.00, 'Charles Oppong', 'y.addo@ghacem.com', 'Active'],
    ['EMP004', 'Ekow Gyan', 'Permanent', 'Maintenance', 'Senior Technician', 48.00, 'Albert Taylor', 'e.gyan@ghacem.com', 'Active'],
    ['EMP005', 'Efua Asare', 'Permanent', 'HR', 'HR Officer', 40.00, 'Sarah Hanson', 'e.asare@ghacem.com', 'Active'],
    ['EMP006', 'Kojo Peprah', 'Permanent', 'Finance', 'Accountant', 55.00, 'Sarah Hanson', 'k.peprah@ghacem.com', 'Active'],
    ['EMP007', 'Yaa Baah', 'Permanent', 'Safety', 'Safety Officer', 46.00, 'Albert Taylor', 'y.baah@ghacem.com', 'Active'],
    ['EMP008', 'Kwaku Mensah', 'Permanent', 'Operations', 'Quarry Operator', 38.00, 'Kofi Mensah', 'kw.mensah@ghacem.com', 'Active'],
    ['EMP009', 'Adjoa Sarfo', 'Permanent', 'Logistics', 'Warehouse Sup', 44.00, 'Charles Oppong', 'a.sarfo@ghacem.com', 'Active'],
    ['EMP010', 'Kofi Boateng', 'Permanent', 'Maintenance', 'Electrical Eng', 52.00, 'Albert Taylor', 'k.boateng@ghacem.com', 'Active'],
    ['CON001', 'Emmanuel Boateng', 'Contract', 'Operations', 'Packing Helper', 35.00, 'Kwame Mensah', 'e.boateng@contractor.com', 'Active'],
    ['CON002', 'Kofi Antwi', 'Contract', 'Operations', 'Driver', 32.00, 'Kwame Mensah', 'k.antwi@contractor.com', 'Active'],
    ['CON003', 'Ama Serwaa', 'Contract', 'Logistics', 'Loader', 30.00, 'Yaw Addo', 'a.serwaa@contractor.com', 'Active'],
    ['CON004', 'Kwabena Kyeremeh', 'Contract', 'Maintenance', 'Mechanic', 36.00, 'Ekow Gyan', 'k.kyeremeh@contractor.com', 'Active'],
    ['CON005', 'John Mensah', 'Contract', 'Safety', 'Fire Marshall', 33.00, 'Yaa Baah', 'j.mensah@contractor.com', 'Active']
  ];

  employees.forEach((emp, rIdx) => {
    const rNum = 6 + rIdx;
    ws2.getRow(rNum).height = 20;
    
    emp.forEach((val, cIdx) => {
      const cell = ws2.getCell(rNum, 2 + cIdx);
      cell.value = val;
      cell.font = styles.regularFont;
      cell.border = styles.thinBorder;
      
      // Formatting specific columns
      if (cIdx === 0) { // ID
        cell.alignment = { horizontal: 'center' };
        cell.font = styles.boldFont;
      } else if (cIdx === 2 || cIdx === 3 || cIdx === 8) { // Type, Dept, Status
        cell.alignment = { horizontal: 'center' };
      } else if (cIdx === 5) { // Rate
        cell.numFmt = '"GHS" #,##0.00';
        cell.alignment = { horizontal: 'right' };
      }

      // Zebra striping
      if (rIdx % 2 === 1) {
        cell.fill = styles.zebraFill;
      }
    });

    // Data validations
    ws2.getCell(`D${rNum}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Permanent,Contract"']
    };
    ws2.getCell(`E${rNum}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Operations,Logistics,Maintenance,HR,Finance,Safety,Sales"']
    };
    ws2.getCell(`J${rNum}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Active,Inactive"']
    };
  });

  ws2.getColumn('A').width = 3;
  ws2.getColumn('B').width = 15; // ID
  ws2.getColumn('C').width = 22; // Name
  ws2.getColumn('D').width = 14; // Staff Type
  ws2.getColumn('E').width = 16; // Department
  ws2.getColumn('F').width = 20; // Role
  ws2.getColumn('G').width = 25; // Hourly Rate
  ws2.getColumn('H').width = 18; // Manager
  ws2.getColumn('I').width = 26; // Email
  ws2.getColumn('J').width = 12; // Status

  // ----------------------------------------------------
  // SHEET 3: Overtime Records
  // ----------------------------------------------------
  const ws3 = workbook.addWorksheet('Overtime Records');
  createTitleBanner(ws3, 'Overtime Record Ledger', 15);

  const otHeaders = [
    'Record ID', 'Date', 'Employee ID', 'Employee Name', 'Staff Type', 
    'Department', 'Base Rate', 'Overtime Type', 'Hours Worked', 'Multiplier', 
    'Overtime Pay', 'Approval Status', 'Approved By', 'Notes'
  ];

  otHeaders.forEach((h, idx) => {
    const cell = ws3.getCell(5, 2 + idx);
    cell.value = h;
    cell.font = styles.headerFont;
    cell.fill = styles.headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = styles.thinBorder;
  });
  ws3.getRow(5).height = 28;

  // Mock Overtime Records (covering April, May, and June 2026 for trend analysis)
  const otRecords = [
    // April Records (OTR001 - OTR012)
    ['OTR001', new Date('2026-04-02'), 'EMP001', 'Weekday', 4.0, 'Approved', 'Sarah Hanson', 'Extended shift for kiln repair'],
    ['OTR002', new Date('2026-04-03'), 'EMP002', 'Weekday', 3.0, 'Approved', 'Sarah Hanson', 'Late billing reconciliation'],
    ['OTR003', new Date('2026-04-04'), 'CON001', 'Weekend', 6.0, 'Approved', 'Kwame Mensah', 'Silo clearing support'],
    ['OTR004', new Date('2026-04-05'), 'CON002', 'Weekend', 8.0, 'Approved', 'Kwame Mensah', 'Emergency raw material delivery'],
    ['OTR005', new Date('2026-04-07'), 'EMP004', 'Emergency', 5.0, 'Approved', 'Albert Taylor', 'Electrical fault in clinker cooler'],
    ['OTR006', new Date('2026-04-10'), 'EMP007', 'Weekday', 2.5, 'Approved', 'Albert Taylor', 'Safety inspection after hours'],
    ['OTR007', new Date('2026-04-11'), 'CON003', 'Weekend', 6.0, 'Approved', 'Yaw Addo', 'Bagging line packing help'],
    ['OTR008', new Date('2026-04-12'), 'CON004', 'Weekend', 7.5, 'Approved', 'Ekow Gyan', 'Scheduled conveyor belt maintenance'],
    ['OTR009', new Date('2026-04-14'), 'EMP003', 'Weekday', 2.0, 'Approved', 'Charles Oppong', 'Late truck dispatching checks'],
    ['OTR010', new Date('2026-04-15'), 'EMP008', 'Weekday', 4.0, 'Rejected', 'Kofi Mensah', 'Unapproved overtime extension'],
    ['OTR011', new Date('2026-04-18'), 'EMP009', 'Weekend', 5.0, 'Approved', 'Charles Oppong', 'Warehouse inventory count'],
    ['OTR012', new Date('2026-04-22'), 'CON005', 'Holiday', 8.0, 'Approved', 'Yaa Baah', 'Holiday safety standby coverage'],

    // May Records (OTR013 - OTR024)
    ['OTR013', new Date('2026-05-01'), 'EMP001', 'Holiday', 6.0, 'Approved', 'Kofi Mensah', 'May Day plant supervisor cover'],
    ['OTR014', new Date('2026-05-02'), 'CON001', 'Weekday', 3.5, 'Approved', 'Kwame Mensah', 'Bagging line overflow support'],
    ['OTR015', new Date('2026-05-03'), 'EMP002', 'Weekend', 8.0, 'Approved', 'Kofi Mensah', 'Sunday system backup and maintenance'],
    ['OTR016', new Date('2026-05-05'), 'EMP005', 'Weekday', 2.0, 'Approved', 'Sarah Hanson', 'Employee onboarding backlog'],
    ['OTR017', new Date('2026-05-08'), 'EMP010', 'Emergency', 4.5, 'Approved', 'Albert Taylor', 'Main grid power failure response'],
    ['OTR018', new Date('2026-05-12'), 'CON002', 'Weekday', 3.0, 'Approved', 'Kwame Mensah', 'Evening cement dispatch transport'],
    ['OTR019', new Date('2026-05-15'), 'EMP006', 'Weekday', 4.0, 'Approved', 'Sarah Hanson', 'Mid-month budget preparations'],
    ['OTR020', new Date('2026-05-18'), 'CON003', 'Weekday', 4.0, 'Approved', 'Yaw Addo', 'Additional truck loader duties'],
    ['OTR021', new Date('2026-05-20'), 'EMP004', 'Weekday', 3.0, 'Approved', 'Albert Taylor', 'Pre-shift equipment inspection'],
    ['OTR022', new Date('2026-05-24'), 'CON004', 'Weekend', 8.0, 'Approved', 'Ekow Gyan', 'Compressor overhaul assistance'],
    ['OTR023', new Date('2026-05-27'), 'EMP008', 'Weekday', 5.0, 'Pending', 'Kofi Mensah', 'Awaiting review - extra kiln support'],
    ['OTR024', new Date('2026-05-29'), 'EMP003', 'Weekday', 3.0, 'Approved', 'Charles Oppong', 'Late customer order processing'],

    // June Records (OTR025 - OTR040)
    ['OTR025', new Date('2026-06-01'), 'EMP001', 'Weekday', 4.0, 'Approved', 'Kofi Mensah', 'Supervising early morning startup'],
    ['OTR026', new Date('2026-06-02'), 'CON001', 'Weekday', 3.0, 'Approved', 'Kwame Mensah', 'Silo packing assistant'],
    ['OTR027', new Date('2026-06-03'), 'EMP002', 'Weekday', 3.5, 'Approved', 'Kofi Mensah', 'Control room handover delay'],
    ['OTR028', new Date('2026-06-04'), 'EMP004', 'Weekday', 4.5, 'Approved', 'Albert Taylor', 'Routine crusher lubrication'],
    ['OTR029', new Date('2026-06-05'), 'CON004', 'Weekday', 9.0, 'Approved', 'Ekow Gyan', 'Crusher repair - exceeded 8 hrs limit'],
    ['OTR030', new Date('2026-06-06'), 'EMP007', 'Weekend', 6.0, 'Approved', 'Albert Taylor', 'Weekend site safety verification'],
    ['OTR031', new Date('2026-06-07'), 'CON002', 'Weekend', 8.0, 'Approved', 'Kwame Mensah', 'Bulk loading logistics driver'],
    ['OTR032', new Date('2026-06-08'), 'EMP010', 'Weekday', 2.0, 'Approved', 'Albert Taylor', 'Control system update monitoring'],
    ['OTR033', new Date('2026-06-09'), 'EMP003', 'Weekday', 3.0, 'Approved', 'Charles Oppong', 'Logistics coordination meeting'],
    ['OTR034', new Date('2026-06-10'), 'CON003', 'Weekday', 5.0, 'Approved', 'Yaw Addo', 'Cement bag shipping duties'],
    ['OTR035', new Date('2026-06-11'), 'EMP009', 'Weekday', 3.0, 'Approved', 'Charles Oppong', 'Stock checks and auditing'],
    ['OTR036', new Date('2026-06-12'), 'CON005', 'Emergency', 6.0, 'Approved', 'Yaa Baah', 'Accident response & incident report'],
    ['OTR037', new Date('2026-06-13'), 'EMP008', 'Weekend', 8.0, 'Approved', 'Kofi Mensah', 'Saturday quarry operations cover'],
    ['OTR038', new Date('2026-06-14'), 'EMP001', 'Weekend', 8.0, 'Pending', 'Kofi Mensah', 'Kiln monitoring weekend shift'],
    ['OTR039', new Date('2026-06-15'), 'EMP006', 'Weekday', 5.0, 'Approved', 'Sarah Hanson', 'Tax filing and audits preparation'],
    ['OTR040', new Date('2026-06-15'), 'CON001', 'Weekday', 4.0, 'Pending', 'Kwame Mensah', 'Late cleaning after shift close']
  ];

  otRecords.forEach((rec, rIdx) => {
    const rNum = 6 + rIdx;
    ws3.getRow(rNum).height = 20;

    // Col B: Record ID
    ws3.getCell(`B${rNum}`).value = rec[0];
    ws3.getCell(`B${rNum}`).font = styles.boldFont;
    ws3.getCell(`B${rNum}`).alignment = { horizontal: 'center' };
    ws3.getCell(`B${rNum}`).border = styles.thinBorder;

    // Col C: Date
    ws3.getCell(`C${rNum}`).value = rec[1];
    ws3.getCell(`C${rNum}`).font = styles.regularFont;
    ws3.getCell(`C${rNum}`).alignment = { horizontal: 'center' };
    ws3.getCell(`C${rNum}`).border = styles.thinBorder;
    ws3.getCell(`C${rNum}`).numFmt = 'YYYY-MM-DD';

    // Col D: Employee ID
    ws3.getCell(`D${rNum}`).value = rec[2];
    ws3.getCell(`D${rNum}`).font = styles.boldFont;
    ws3.getCell(`D${rNum}`).alignment = { horizontal: 'center' };
    ws3.getCell(`D${rNum}`).border = styles.thinBorder;
    ws3.getCell(`D${rNum}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ["'Employee Master Data'!$B$6:$B$20"] // References Employee ID column in sheet 2
    };

    // Col E: Employee Name (XLOOKUP)
    ws3.getCell(`E${rNum}`).value = {
      formula: `XLOOKUP(D${rNum}, 'Employee Master Data'!$B$6:$B$20, 'Employee Master Data'!$C$6:$C$20, "Unknown")`
    };
    ws3.getCell(`E${rNum}`).font = styles.regularFont;
    ws3.getCell(`E${rNum}`).border = styles.thinBorder;

    // Col F: Staff Type (XLOOKUP)
    ws3.getCell(`F${rNum}`).value = {
      formula: `XLOOKUP(D${rNum}, 'Employee Master Data'!$B$6:$B$20, 'Employee Master Data'!$D$6:$D$20, "Unknown")`
    };
    ws3.getCell(`F${rNum}`).font = styles.regularFont;
    ws3.getCell(`F${rNum}`).alignment = { horizontal: 'center' };
    ws3.getCell(`F${rNum}`).border = styles.thinBorder;

    // Col G: Department (XLOOKUP)
    ws3.getCell(`G${rNum}`).value = {
      formula: `XLOOKUP(D${rNum}, 'Employee Master Data'!$B$6:$B$20, 'Employee Master Data'!$E$6:$E$20, "Unknown")`
    };
    ws3.getCell(`G${rNum}`).font = styles.regularFont;
    ws3.getCell(`G${rNum}`).alignment = { horizontal: 'center' };
    ws3.getCell(`G${rNum}`).border = styles.thinBorder;

    // Col H: Base Rate (XLOOKUP)
    ws3.getCell(`H${rNum}`).value = {
      formula: `XLOOKUP(D${rNum}, 'Employee Master Data'!$B$6:$B$20, 'Employee Master Data'!$G$6:$G$20, 0)`
    };
    ws3.getCell(`H${rNum}`).font = styles.regularFont;
    ws3.getCell(`H${rNum}`).border = styles.thinBorder;
    ws3.getCell(`H${rNum}`).numFmt = '"GHS" #,##0.00';
    ws3.getCell(`H${rNum}`).alignment = { horizontal: 'right' };

    // Col I: Overtime Type
    ws3.getCell(`I${rNum}`).value = rec[3];
    ws3.getCell(`I${rNum}`).font = styles.regularFont;
    ws3.getCell(`I${rNum}`).border = styles.thinBorder;
    ws3.getCell(`I${rNum}`).alignment = { horizontal: 'center' };
    ws3.getCell(`I${rNum}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Weekday,Weekend,Holiday,Emergency"']
    };

    // Col J: Hours Worked
    ws3.getCell(`J${rNum}`).value = rec[4];
    ws3.getCell(`J${rNum}`).font = styles.regularFont;
    ws3.getCell(`J${rNum}`).border = styles.thinBorder;
    ws3.getCell(`J${rNum}`).alignment = { horizontal: 'right' };
    ws3.getCell(`J${rNum}`).numFmt = '0.0';

    // Col K: Multiplier (XLOOKUP from Instructions & Settings)
    ws3.getCell(`K${rNum}`).value = {
      formula: `XLOOKUP(I${rNum}, 'Instructions & Settings'!$B$16:$B$19, 'Instructions & Settings'!$C$16:$C$19, 1.0)`
    };
    ws3.getCell(`K${rNum}`).font = styles.regularFont;
    ws3.getCell(`K${rNum}`).border = styles.thinBorder;
    ws3.getCell(`K${rNum}`).alignment = { horizontal: 'right' };
    ws3.getCell(`K${rNum}`).numFmt = '0.0"x"';

    // Col L: Overtime Pay (Hours * Multiplier * Base Rate)
    ws3.getCell(`L${rNum}`).value = {
      formula: `J${rNum}*K${rNum}*H${rNum}`
    };
    ws3.getCell(`L${rNum}`).font = styles.boldFont;
    ws3.getCell(`L${rNum}`).border = styles.thinBorder;
    ws3.getCell(`L${rNum}`).numFmt = '"GHS" #,##0.00';
    ws3.getCell(`L${rNum}`).alignment = { horizontal: 'right' };

    // Col M: Approval Status
    ws3.getCell(`M${rNum}`).value = rec[5];
    ws3.getCell(`M${rNum}`).font = styles.boldFont;
    ws3.getCell(`M${rNum}`).border = styles.thinBorder;
    ws3.getCell(`M${rNum}`).alignment = { horizontal: 'center' };
    ws3.getCell(`M${rNum}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Approved,Pending,Rejected"']
    };

    // Col N: Approved By
    ws3.getCell(`N${rNum}`).value = rec[6];
    ws3.getCell(`N${rNum}`).font = styles.regularFont;
    ws3.getCell(`N${rNum}`).border = styles.thinBorder;

    // Col O: Notes
    ws3.getCell(`O${rNum}`).value = rec[7];
    ws3.getCell(`O${rNum}`).font = styles.italicFont;
    ws3.getCell(`O${rNum}`).border = styles.thinBorder;

    // Zebra striping
    if (rIdx % 2 === 1) {
      for (let c = 2; c <= 15; c++) {
        const cell = ws3.getCell(rNum, c);
        if (!cell.fill) cell.fill = styles.zebraFill;
      }
    }
  });

  // Add Conditional Formatting for Approval Status
  ws3.addConditionalFormatting({
    ref: 'M6:M45',
    rules: [
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['"Approved"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.approvedBg } },
          font: { color: { argb: colors.approvedText }, bold: true }
        }
      },
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['"Pending"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.pendingBg } },
          font: { color: { argb: colors.pendingText }, bold: true }
        }
      },
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['"Rejected"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.rejectedBg } },
          font: { color: { argb: colors.rejectedText }, bold: true }
        }
      }
    ]
  });

  // Add Conditional Formatting for High Overtime Hours (> 8 hours)
  ws3.addConditionalFormatting({
    ref: 'J6:J45',
    rules: [
      {
        type: 'cellIs',
        operator: 'greaterThan',
        formulae: ['8'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2E6' } }, // Soft red alert
          font: { color: { argb: 'FFC0000' }, bold: true }
        }
      }
    ]
  });

  ws3.getColumn('A').width = 3;
  ws3.getColumn('B').width = 14; // Record ID
  ws3.getColumn('C').width = 14; // Date
  ws3.getColumn('D').width = 14; // Emp ID
  ws3.getColumn('E').width = 20; // Emp Name
  ws3.getColumn('F').width = 14; // Staff Type
  ws3.getColumn('G').width = 15; // Department
  ws3.getColumn('H').width = 16; // Base Rate
  ws3.getColumn('I').width = 16; // OT Type
  ws3.getColumn('J').width = 14; // Hours Worked
  ws3.getColumn('K').width = 12; // Multiplier
  ws3.getColumn('L').width = 16; // OT Pay
  ws3.getColumn('M').width = 16; // Approval Status
  ws3.getColumn('N').width = 16; // Approved By
  ws3.getColumn('O').width = 35; // Notes

  // ----------------------------------------------------
  // SHEET 4: Payroll Summary (Calculated for June 2026)
  // ----------------------------------------------------
  const ws4 = workbook.addWorksheet('Payroll Summary');
  createTitleBanner(ws4, 'Payroll Reconciliation (June 2026)', 15);

  const payHeaders = [
    'Employee ID', 'Full Name', 'Staff Type', 'Department', 'Hourly Rate',
    'Approved Weekday Hrs', 'Approved Weekend Hrs', 'Approved Holiday Hrs', 'Approved Emergency Hrs',
    'Total Approved Hrs', 'Total OT Pay (Gross GHS)', 'Tax Rate', 'Tax Deduction (GHS)', 'Net OT Pay (GHS)'
  ];

  payHeaders.forEach((h, idx) => {
    const cell = ws4.getCell(5, 2 + idx);
    cell.value = h;
    cell.font = styles.headerFont;
    cell.fill = styles.headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = styles.thinBorder;
  });
  ws4.getRow(5).height = 34;

  employees.forEach((emp, rIdx) => {
    const rNum = 6 + rIdx;
    ws4.getRow(rNum).height = 20;

    // Col B: ID (Formula to Master Data)
    ws4.getCell(`B${rNum}`).value = { formula: `'Employee Master Data'!B${6 + rIdx}` };
    ws4.getCell(`B${rNum}`).font = styles.boldFont;
    ws4.getCell(`B${rNum}`).alignment = { horizontal: 'center' };
    ws4.getCell(`B${rNum}`).border = styles.thinBorder;

    // Col C: Name
    ws4.getCell(`C${rNum}`).value = { formula: `XLOOKUP(B${rNum}, 'Employee Master Data'!$B$6:$B$20, 'Employee Master Data'!$C$6:$C$20, "")` };
    ws4.getCell(`C${rNum}`).font = styles.regularFont;
    ws4.getCell(`C${rNum}`).border = styles.thinBorder;

    // Col D: Staff Type
    ws4.getCell(`D${rNum}`).value = { formula: `XLOOKUP(B${rNum}, 'Employee Master Data'!$B$6:$B$20, 'Employee Master Data'!$D$6:$D$20, "")` };
    ws4.getCell(`D${rNum}`).font = styles.regularFont;
    ws4.getCell(`D${rNum}`).alignment = { horizontal: 'center' };
    ws4.getCell(`D${rNum}`).border = styles.thinBorder;

    // Col E: Department
    ws4.getCell(`E${rNum}`).value = { formula: `XLOOKUP(B${rNum}, 'Employee Master Data'!$B$6:$B$20, 'Employee Master Data'!$E$6:$E$20, "")` };
    ws4.getCell(`E${rNum}`).font = styles.regularFont;
    ws4.getCell(`E${rNum}`).alignment = { horizontal: 'center' };
    ws4.getCell(`E${rNum}`).border = styles.thinBorder;

    // Col F: Hourly Rate
    ws4.getCell(`F${rNum}`).value = { formula: `XLOOKUP(B${rNum}, 'Employee Master Data'!$B$6:$B$20, 'Employee Master Data'!$G$6:$G$20, 0)` };
    ws4.getCell(`F${rNum}`).font = styles.regularFont;
    ws4.getCell(`F${rNum}`).border = styles.thinBorder;
    ws4.getCell(`F${rNum}`).numFmt = '"GHS" #,##0.00';
    ws4.getCell(`F${rNum}`).alignment = { horizontal: 'right' };

    // June dates filter helper in formulas: ">=2026-06-01" and "<=2026-06-30"
    // Col G: Weekday Hrs (SUMIFS Approved)
    ws4.getCell(`G${rNum}`).value = {
      formula: `SUMIFS('Overtime Records'!$J$6:$J$45, 'Overtime Records'!$D$6:$D$45, B${rNum}, 'Overtime Records'!$I$6:$I$45, "Weekday", 'Overtime Records'!$M$6:$M$45, "Approved", 'Overtime Records'!$C$6:$C$45, ">=2026-06-01", 'Overtime Records'!$C$6:$C$45, "<=2026-06-30")`
    };
    ws4.getCell(`G${rNum}`).font = styles.regularFont;
    ws4.getCell(`G${rNum}`).border = styles.thinBorder;
    ws4.getCell(`G${rNum}`).alignment = { horizontal: 'right' };
    ws4.getCell(`G${rNum}`).numFmt = '0.0';

    // Col H: Weekend Hrs
    ws4.getCell(`H${rNum}`).value = {
      formula: `SUMIFS('Overtime Records'!$J$6:$J$45, 'Overtime Records'!$D$6:$D$45, B${rNum}, 'Overtime Records'!$I$6:$I$45, "Weekend", 'Overtime Records'!$M$6:$M$45, "Approved", 'Overtime Records'!$C$6:$C$45, ">=2026-06-01", 'Overtime Records'!$C$6:$C$45, "<=2026-06-30")`
    };
    ws4.getCell(`H${rNum}`).font = styles.regularFont;
    ws4.getCell(`H${rNum}`).border = styles.thinBorder;
    ws4.getCell(`H${rNum}`).alignment = { horizontal: 'right' };
    ws4.getCell(`H${rNum}`).numFmt = '0.0';

    // Col I: Holiday Hrs
    ws4.getCell(`I${rNum}`).value = {
      formula: `SUMIFS('Overtime Records'!$J$6:$J$45, 'Overtime Records'!$D$6:$D$45, B${rNum}, 'Overtime Records'!$I$6:$I$45, "Holiday", 'Overtime Records'!$M$6:$M$45, "Approved", 'Overtime Records'!$C$6:$C$45, ">=2026-06-01", 'Overtime Records'!$C$6:$C$45, "<=2026-06-30")`
    };
    ws4.getCell(`I${rNum}`).font = styles.regularFont;
    ws4.getCell(`I${rNum}`).border = styles.thinBorder;
    ws4.getCell(`I${rNum}`).alignment = { horizontal: 'right' };
    ws4.getCell(`I${rNum}`).numFmt = '0.0';

    // Col J: Emergency Hrs
    ws4.getCell(`J${rNum}`).value = {
      formula: `SUMIFS('Overtime Records'!$J$6:$J$45, 'Overtime Records'!$D$6:$D$45, B${rNum}, 'Overtime Records'!$I$6:$I$45, "Emergency", 'Overtime Records'!$M$6:$M$45, "Approved", 'Overtime Records'!$C$6:$C$45, ">=2026-06-01", 'Overtime Records'!$C$6:$C$45, "<=2026-06-30")`
    };
    ws4.getCell(`J${rNum}`).font = styles.regularFont;
    ws4.getCell(`J${rNum}`).border = styles.thinBorder;
    ws4.getCell(`J${rNum}`).alignment = { horizontal: 'right' };
    ws4.getCell(`J${rNum}`).numFmt = '0.0';

    // Col K: Total Approved Hrs
    ws4.getCell(`K${rNum}`).value = { formula: `SUM(G${rNum}:J${rNum})` };
    ws4.getCell(`K${rNum}`).font = styles.boldFont;
    ws4.getCell(`K${rNum}`).border = styles.thinBorder;
    ws4.getCell(`K${rNum}`).alignment = { horizontal: 'right' };
    ws4.getCell(`K${rNum}`).numFmt = '0.0';

    // Col L: Total OT Pay (Gross GHS)
    ws4.getCell(`L${rNum}`).value = {
      formula: `SUMIFS('Overtime Records'!$L$6:$L$45, 'Overtime Records'!$D$6:$D$45, B${rNum}, 'Overtime Records'!$M$6:$M$45, "Approved", 'Overtime Records'!$C$6:$C$45, ">=2026-06-01", 'Overtime Records'!$C$6:$C$45, "<=2026-06-30")`
    };
    ws4.getCell(`L${rNum}`).font = styles.boldFont;
    ws4.getCell(`L${rNum}`).border = styles.thinBorder;
    ws4.getCell(`L${rNum}`).numFmt = '"GHS" #,##0.00';
    ws4.getCell(`L${rNum}`).alignment = { horizontal: 'right' };

    // Col M: Tax Rate (Formula based on Staff Type lookup)
    ws4.getCell(`M${rNum}`).value = {
      formula: `IF(D${rNum}="Contract", 'Instructions & Settings'!$G$17, 'Instructions & Settings'!$G$18)`
    };
    ws4.getCell(`M${rNum}`).font = styles.regularFont;
    ws4.getCell(`M${rNum}`).border = styles.thinBorder;
    ws4.getCell(`M${rNum}`).alignment = { horizontal: 'right' };
    ws4.getCell(`M${rNum}`).numFmt = '0.0%';

    // Col N: Tax Deduction
    ws4.getCell(`N${rNum}`).value = { formula: `L${rNum}*M${rNum}` };
    ws4.getCell(`N${rNum}`).font = styles.regularFont;
    ws4.getCell(`N${rNum}`).border = styles.thinBorder;
    ws4.getCell(`N${rNum}`).numFmt = '"GHS" #,##0.00';
    ws4.getCell(`N${rNum}`).alignment = { horizontal: 'right' };

    // Col O: Net OT Pay (GHS)
    ws4.getCell(`O${rNum}`).value = { formula: `L${rNum}-N${rNum}` };
    ws4.getCell(`O${rNum}`).font = styles.boldFont;
    ws4.getCell(`O${rNum}`).border = styles.thinBorder;
    ws4.getCell(`O${rNum}`).numFmt = '"GHS" #,##0.00';
    ws4.getCell(`O${rNum}`).alignment = { horizontal: 'right' };

    // Zebra striping
    if (rIdx % 2 === 1) {
      for (let c = 2; c <= 15; c++) {
        ws4.getCell(rNum, c).fill = styles.zebraFill;
      }
    }
  });

  // Row 21: Totals Row
  const tRow = 6 + employees.length;
  ws4.getRow(tRow).height = 24;
  
  ws4.mergeCells(tRow, 2, tRow, 6);
  ws4.getCell(tRow, 2).value = 'Total Reconciliation';
  ws4.getCell(tRow, 2).font = styles.boldFont;
  ws4.getCell(tRow, 2).alignment = { horizontal: 'right', vertical: 'middle' };
  
  for (let c = 2; c <= 6; c++) {
    ws4.getCell(tRow, c).border = styles.doubleBottomBorder;
    ws4.getCell(tRow, c).fill = styles.greyHeaderFill;
  }

  const columnsToSum = ['G', 'H', 'I', 'J', 'K', 'L', 'N', 'O'];
  columnsToSum.forEach(col => {
    const cell = ws4.getCell(`${col}${tRow}`);
    cell.value = { formula: `SUM(${col}6:${col}${tRow-1})` };
    cell.font = styles.boldFont;
    cell.border = styles.doubleBottomBorder;
    cell.fill = styles.greyHeaderFill;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    
    if (col === 'L' || col === 'N' || col === 'O') {
      cell.numFmt = '"GHS" #,##0.00';
    } else {
      cell.numFmt = '0.0';
    }
  });
  
  // Empty format for Tax Rate column in total row
  ws4.getCell(`M${tRow}`).border = styles.doubleBottomBorder;
  ws4.getCell(`M${tRow}`).fill = styles.greyHeaderFill;

  // Add Conditional Formatting for Overtime Hours Alert in summary sheet
  ws4.addConditionalFormatting({
    ref: `K6:K${tRow-1}`,
    rules: [
      {
        type: 'expression',
        formulae: [`K6>'Instructions & Settings'!$G$16`],
        style: {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2E6' } }, // light orange
          font: { color: { argb: colors.orange }, bold: true }
        }
      }
    ]
  });

  ws4.getColumn('A').width = 3;
  ws4.getColumn('B').width = 14; // ID
  ws4.getColumn('C').width = 20; // Name
  ws4.getColumn('D').width = 14; // Staff Type
  ws4.getColumn('E').width = 16; // Department
  ws4.getColumn('F').width = 16; // Hourly Rate
  ws4.getColumn('G').width = 18; // Weekday Hrs
  ws4.getColumn('H').width = 18; // Weekend Hrs
  ws4.getColumn('I').width = 18; // Holiday Hrs
  ws4.getColumn('J').width = 18; // Emergency Hrs
  ws4.getColumn('K').width = 18; // Total Hrs
  ws4.getColumn('L').width = 22; // Total OT Pay
  ws4.getColumn('M').width = 12; // Tax Rate
  ws4.getColumn('N').width = 18; // Tax Deduction
  ws4.getColumn('O').width = 22; // Net OT Pay

  // ----------------------------------------------------
  // SHEET 5: Department & Monthly Summaries
  // ----------------------------------------------------
  const ws5 = workbook.addWorksheet('Department & Monthly Summaries');
  createTitleBanner(ws5, 'Department & Monthly Trends Analysis', 7);

  // Table 1: Department Overtime Analysis
  ws5.getCell('B5').value = 'Department Overtime Summary';
  ws5.getCell('B5').font = styles.sectionFont;

  const deptHeaders = [
    'Department', 'Active Employees', 'Approved OT Hours', 
    'Approved OT Costs', 'Avg OT Hours / Employee', 'OT Cost % Share'
  ];

  deptHeaders.forEach((h, idx) => {
    const cell = ws5.getCell(6, 2 + idx);
    cell.value = h;
    cell.font = styles.headerFont;
    cell.fill = styles.headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = styles.thinBorder;
  });
  ws5.getRow(6).height = 24;

  const depts = ['Operations', 'Logistics', 'Maintenance', 'HR', 'Finance', 'Safety', 'Sales'];

  depts.forEach((dept, idx) => {
    const rNum = 7 + idx;
    ws5.getRow(rNum).height = 20;

    // Col B: Dept Name
    ws5.getCell(`B${rNum}`).value = dept;
    ws5.getCell(`B${rNum}`).font = styles.boldFont;
    ws5.getCell(`B${rNum}`).border = styles.thinBorder;

    // Col C: Active Employees
    ws5.getCell(`C${rNum}`).value = {
      formula: `COUNTIFS('Employee Master Data'!$E$6:$E$20, B${rNum}, 'Employee Master Data'!$J$6:$J$20, "Active")`
    };
    ws5.getCell(`C${rNum}`).font = styles.regularFont;
    ws5.getCell(`C${rNum}`).alignment = { horizontal: 'center' };
    ws5.getCell(`C${rNum}`).border = styles.thinBorder;

    // Col D: Approved OT Hours
    ws5.getCell(`D${rNum}`).value = {
      formula: `SUMIFS('Payroll Summary'!$K$6:$K$20, 'Payroll Summary'!$E$6:$E$20, B${rNum})`
    };
    ws5.getCell(`D${rNum}`).font = styles.regularFont;
    ws5.getCell(`D${rNum}`).alignment = { horizontal: 'right' };
    ws5.getCell(`D${rNum}`).border = styles.thinBorder;
    ws5.getCell(`D${rNum}`).numFmt = '0.0';

    // Col E: Approved OT Costs
    ws5.getCell(`E${rNum}`).value = {
      formula: `SUMIFS('Payroll Summary'!$L$6:$L$20, 'Payroll Summary'!$E$6:$E$20, B${rNum})`
    };
    ws5.getCell(`E${rNum}`).font = styles.regularFont;
    ws5.getCell(`E${rNum}`).alignment = { horizontal: 'right' };
    ws5.getCell(`E${rNum}`).border = styles.thinBorder;
    ws5.getCell(`E${rNum}`).numFmt = '"GHS" #,##0.00';

    // Col F: Avg OT Hours / Employee
    ws5.getCell(`F${rNum}`).value = {
      formula: `IF(C${rNum}>0, D${rNum}/C${rNum}, 0)`
    };
    ws5.getCell(`F${rNum}`).font = styles.regularFont;
    ws5.getCell(`F${rNum}`).alignment = { horizontal: 'right' };
    ws5.getCell(`F${rNum}`).border = styles.thinBorder;
    ws5.getCell(`F${rNum}`).numFmt = '0.0';

    // Col G: OT Cost % Share
    ws5.getCell(`G${rNum}`).value = {
      formula: `E${rNum}/$E$14`
    };
    ws5.getCell(`G${rNum}`).font = styles.regularFont;
    ws5.getCell(`G${rNum}`).alignment = { horizontal: 'right' };
    ws5.getCell(`G${rNum}`).border = styles.thinBorder;
    ws5.getCell(`G${rNum}`).numFmt = '0.0%';

    // Zebra striping
    if (idx % 2 === 1) {
      for (let c = 2; c <= 7; c++) {
        ws5.getCell(rNum, c).fill = styles.zebraFill;
      }
    }
  });

  // Dept Totals Row (Row 14)
  ws5.getRow(14).height = 22;
  ws5.getCell('B14').value = 'Total Departments';
  ws5.getCell('B14').font = styles.boldFont;
  ws5.getCell('B14').alignment = { horizontal: 'right' };
  ws5.getCell('B14').border = styles.doubleBottomBorder;
  ws5.getCell('B14').fill = styles.greyHeaderFill;

  ws5.getCell('C14').value = { formula: 'SUM(C7:C13)' };
  ws5.getCell('C14').font = styles.boldFont;
  ws5.getCell('C14').alignment = { horizontal: 'center' };
  ws5.getCell('C14').border = styles.doubleBottomBorder;
  ws5.getCell('C14').fill = styles.greyHeaderFill;

  ws5.getCell('D14').value = { formula: 'SUM(D7:D13)' };
  ws5.getCell('D14').font = styles.boldFont;
  ws5.getCell('D14').alignment = { horizontal: 'right' };
  ws5.getCell('D14').border = styles.doubleBottomBorder;
  ws5.getCell('D14').fill = styles.greyHeaderFill;
  ws5.getCell('D14').numFmt = '0.0';

  ws5.getCell('E14').value = { formula: 'SUM(E7:E13)' };
  ws5.getCell('E14').font = styles.boldFont;
  ws5.getCell('E14').alignment = { horizontal: 'right' };
  ws5.getCell('E14').border = styles.doubleBottomBorder;
  ws5.getCell('E14').fill = styles.greyHeaderFill;
  ws5.getCell('E14').numFmt = '"GHS" #,##0.00';

  ws5.getCell('F14').value = { formula: 'AVERAGE(F7:F13)' };
  ws5.getCell('F14').font = styles.boldFont;
  ws5.getCell('F14').alignment = { horizontal: 'right' };
  ws5.getCell('F14').border = styles.doubleBottomBorder;
  ws5.getCell('F14').fill = styles.greyHeaderFill;
  ws5.getCell('F14').numFmt = '0.0';

  ws5.getCell('G14').value = { formula: 'SUM(G7:G13)' };
  ws5.getCell('G14').font = styles.boldFont;
  ws5.getCell('G14').alignment = { horizontal: 'right' };
  ws5.getCell('G14').border = styles.doubleBottomBorder;
  ws5.getCell('G14').fill = styles.greyHeaderFill;
  ws5.getCell('G14').numFmt = '0.0%';


  // Table 2: Monthly Overtime Trends (Stacked below)
  ws5.getCell('B17').value = 'Monthly Trend Analysis (Q2 2026)';
  ws5.getCell('B17').font = styles.sectionFont;

  const trendHeaders = [
    'Month / Period', 'Total OT Requests', 'Approved Requests', 
    'Approved Hours', 'Approved OT Costs (GHS)', 'Request Approval Rate'
  ];

  trendHeaders.forEach((h, idx) => {
    const cell = ws5.getCell(18, 2 + idx);
    cell.value = h;
    cell.font = styles.headerFont;
    cell.fill = styles.headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = styles.thinBorder;
  });
  ws5.getRow(18).height = 24;

  const months = [
    ['April 2026', '2026-04-01', '2026-04-30'],
    ['May 2026', '2026-05-01', '2026-05-31'],
    ['June 2026', '2026-06-01', '2026-06-30']
  ];

  months.forEach((m, idx) => {
    const rNum = 19 + idx;
    ws5.getRow(rNum).height = 20;

    // Period
    ws5.getCell(`B${rNum}`).value = m[0];
    ws5.getCell(`B${rNum}`).font = styles.boldFont;
    ws5.getCell(`B${rNum}`).border = styles.thinBorder;

    // Total Requests
    ws5.getCell(`C${rNum}`).value = {
      formula: `COUNTIFS('Overtime Records'!$C$6:$C$45, ">=${m[1]}", 'Overtime Records'!$C$6:$C$45, "<=${m[2]}")`
    };
    ws5.getCell(`C${rNum}`).font = styles.regularFont;
    ws5.getCell(`C${rNum}`).alignment = { horizontal: 'center' };
    ws5.getCell(`C${rNum}`).border = styles.thinBorder;

    // Approved Requests
    ws5.getCell(`D${rNum}`).value = {
      formula: `COUNTIFS('Overtime Records'!$C$6:$C$45, ">=${m[1]}", 'Overtime Records'!$C$6:$C$45, "<=${m[2]}", 'Overtime Records'!$M$6:$M$45, "Approved")`
    };
    ws5.getCell(`D${rNum}`).font = styles.regularFont;
    ws5.getCell(`D${rNum}`).alignment = { horizontal: 'center' };
    ws5.getCell(`D${rNum}`).border = styles.thinBorder;

    // Approved Hours
    ws5.getCell(`E${rNum}`).value = {
      formula: `SUMIFS('Overtime Records'!$J$6:$J$45, 'Overtime Records'!$C$6:$C$45, ">=${m[1]}", 'Overtime Records'!$C$6:$C$45, "<=${m[2]}", 'Overtime Records'!$M$6:$M$45, "Approved")`
    };
    ws5.getCell(`E${rNum}`).font = styles.regularFont;
    ws5.getCell(`E${rNum}`).alignment = { horizontal: 'right' };
    ws5.getCell(`E${rNum}`).border = styles.thinBorder;
    ws5.getCell(`E${rNum}`).numFmt = '0.0';

    // Approved OT Costs
    ws5.getCell(`F${rNum}`).value = {
      formula: `SUMIFS('Overtime Records'!$L$6:$L$45, 'Overtime Records'!$C$6:$C$45, ">=${m[1]}", 'Overtime Records'!$C$6:$C$45, "<=${m[2]}", 'Overtime Records'!$M$6:$M$45, "Approved")`
    };
    ws5.getCell(`F${rNum}`).font = styles.regularFont;
    ws5.getCell(`F${rNum}`).alignment = { horizontal: 'right' };
    ws5.getCell(`F${rNum}`).border = styles.thinBorder;
    ws5.getCell(`F${rNum}`).numFmt = '"GHS" #,##0.00';

    // Request Approval Rate
    ws5.getCell(`G${rNum}`).value = {
      formula: `IF(C${rNum}>0, D${rNum}/C${rNum}, 0)`
    };
    ws5.getCell(`G${rNum}`).font = styles.boldFont;
    ws5.getCell(`G${rNum}`).alignment = { horizontal: 'right' };
    ws5.getCell(`G${rNum}`).border = styles.thinBorder;
    ws5.getCell(`G${rNum}`).numFmt = '0.0%';

    // Zebra striping
    if (idx % 2 === 1) {
      for (let c = 2; c <= 7; c++) {
        ws5.getCell(rNum, c).fill = styles.zebraFill;
      }
    }
  });

  // Trends Totals Row (Row 22)
  ws5.getRow(22).height = 22;
  ws5.getCell('B22').value = 'Total Period';
  ws5.getCell('B22').font = styles.boldFont;
  ws5.getCell('B22').alignment = { horizontal: 'right' };
  ws5.getCell('B22').border = styles.doubleBottomBorder;
  ws5.getCell('B22').fill = styles.greyHeaderFill;

  ws5.getCell('C22').value = { formula: 'SUM(C19:C21)' };
  ws5.getCell('C22').font = styles.boldFont;
  ws5.getCell('C22').alignment = { horizontal: 'center' };
  ws5.getCell('C22').border = styles.doubleBottomBorder;
  ws5.getCell('C22').fill = styles.greyHeaderFill;

  ws5.getCell('D22').value = { formula: 'SUM(D19:D21)' };
  ws5.getCell('D22').font = styles.boldFont;
  ws5.getCell('D22').alignment = { horizontal: 'center' };
  ws5.getCell('D22').border = styles.doubleBottomBorder;
  ws5.getCell('D22').fill = styles.greyHeaderFill;

  ws5.getCell('E22').value = { formula: 'SUM(E19:E21)' };
  ws5.getCell('E22').font = styles.boldFont;
  ws5.getCell('E22').alignment = { horizontal: 'right' };
  ws5.getCell('E22').border = styles.doubleBottomBorder;
  ws5.getCell('E22').fill = styles.greyHeaderFill;
  ws5.getCell('E22').numFmt = '0.0';

  ws5.getCell('F22').value = { formula: 'SUM(F19:F21)' };
  ws5.getCell('F22').font = styles.boldFont;
  ws5.getCell('F22').alignment = { horizontal: 'right' };
  ws5.getCell('F22').border = styles.doubleBottomBorder;
  ws5.getCell('F22').fill = styles.greyHeaderFill;
  ws5.getCell('F22').numFmt = '"GHS" #,##0.00';

  ws5.getCell('G22').value = { formula: 'D22/C22' };
  ws5.getCell('G22').font = styles.boldFont;
  ws5.getCell('G22').alignment = { horizontal: 'right' };
  ws5.getCell('G22').border = styles.doubleBottomBorder;
  ws5.getCell('G22').fill = styles.greyHeaderFill;
  ws5.getCell('G22').numFmt = '0.0%';

  ws5.getColumn('A').width = 3;
  ws5.getColumn('B').width = 25; // Item Name
  ws5.getColumn('C').width = 18; // Active/Requests
  ws5.getColumn('D').width = 18; // Approved Hours
  ws5.getColumn('E').width = 20; // Approved Costs
  ws5.getColumn('F').width = 24; // Avg Hours / Rate
  ws5.getColumn('G').width = 22; // Share / Approval Rate

  // ----------------------------------------------------
  // SHEET 6: KPI Dashboard
  // ----------------------------------------------------
  const ws6 = workbook.addWorksheet('KPI Dashboard');
  ws6.views = [{ showGridLines: false }]; // Modern desktop application feel (hide grid lines)
  createTitleBanner(ws6, 'Executive Overtime Dashboard', 9);

  // Row 5-7: 4 KPI Cards side-by-side
  // KPI 1: Total Overtime Spend (Cols B-C)
  ws6.mergeCells('B5:C5');
  ws6.getCell('B5').value = 'TOTAL OVERTIME SPEND (APPROVED)';
  ws6.getCell('B5').font = styles.cardTitleFont;
  ws6.getCell('B5').alignment = { horizontal: 'center', vertical: 'middle' };
  
  ws6.mergeCells('B6:C7');
  ws6.getCell('B6').value = { formula: `'Department & Monthly Summaries'!E14` }; // Sum of Dept Costs
  ws6.getCell('B6').font = styles.cardValFont;
  ws6.getCell('B6').alignment = { horizontal: 'center', vertical: 'middle' };
  ws6.getCell('B6').numFmt = '"GHS" #,##0.00';
  
  // KPI 2: Total Approved Hours (Cols D-E)
  ws6.mergeCells('D5:E5');
  ws6.getCell('D5').value = 'TOTAL OVERTIME HOURS (APPROVED)';
  ws6.getCell('D5').font = styles.cardTitleFont;
  ws6.getCell('D5').alignment = { horizontal: 'center', vertical: 'middle' };
  
  ws6.mergeCells('D6:E7');
  ws6.getCell('D6').value = { formula: `'Department & Monthly Summaries'!D14` }; // Sum of Dept Hours
  ws6.getCell('D6').font = styles.cardValFont;
  ws6.getCell('D6').alignment = { horizontal: 'center', vertical: 'middle' };
  ws6.getCell('D6').numFmt = '#,##0.0';

  // KPI 3: Request Approval Rate (Cols F-G)
  ws6.mergeCells('F5:G5');
  ws6.getCell('F5').value = 'REQUEST APPROVAL RATE';
  ws6.getCell('F5').font = styles.cardTitleFont;
  ws6.getCell('F5').alignment = { horizontal: 'center', vertical: 'middle' };
  
  ws6.mergeCells('F6:G7');
  ws6.getCell('F6').value = { formula: `'Department & Monthly Summaries'!G22` }; // Approved / Total requests
  ws6.getCell('F6').font = styles.cardValFont;
  ws6.getCell('F6').alignment = { horizontal: 'center', vertical: 'middle' };
  ws6.getCell('F6').numFmt = '0.0%';

  // KPI 4: Active OT Employees (Cols H-I)
  ws6.mergeCells('H5:I5');
  ws6.getCell('H5').value = 'ACTIVE EMPLOYEES';
  ws6.getCell('H5').font = styles.cardTitleFont;
  ws6.getCell('H5').alignment = { horizontal: 'center', vertical: 'middle' };
  
  ws6.mergeCells('H6:I7');
  ws6.getCell('H6').value = { formula: `'Department & Monthly Summaries'!C14` };
  ws6.getCell('H6').font = styles.cardValFont;
  ws6.getCell('H6').alignment = { horizontal: 'center', vertical: 'middle' };
  ws6.getCell('H6').numFmt = '0';

  // Apply card borders & fills
  const cardRanges = [
    { startRow: 5, endRow: 7, startCol: 2, endCol: 3 },
    { startRow: 5, endRow: 7, startCol: 4, endCol: 5 },
    { startRow: 5, endRow: 7, startCol: 6, endCol: 7 },
    { startRow: 5, endRow: 7, startCol: 8, endCol: 9 }
  ];

  cardRanges.forEach(range => {
    for (let r = range.startRow; r <= range.endRow; r++) {
      for (let c = range.startCol; c <= range.endCol; c++) {
        const cell = ws6.getCell(r, c);
        cell.fill = styles.cardFill;
        // Apply outline border to cards
        cell.border = {
          top: r === range.startRow ? { style: 'thin', color: { argb: colors.navy } } : null,
          bottom: r === range.endRow ? { style: 'thin', color: { argb: colors.navy } } : null,
          left: c === range.startCol ? { style: 'thin', color: { argb: colors.navy } } : null,
          right: c === range.endCol ? { style: 'thin', color: { argb: colors.navy } } : null
        };
      }
    }
  });

  // Table 1 on Dashboard: Department Overview (Rows 10-18)
  ws6.getCell('B9').value = 'Department Overtime Rankings';
  ws6.getCell('B9').font = styles.sectionFont;

  const dbHeaders = ['Department', 'Approved Hours', 'Approved Cost', 'Visual Share Indicator'];
  dbHeaders.forEach((h, idx) => {
    const cell = ws6.getCell(10, 2 + idx);
    cell.value = idx === 3 ? 'Budget Share' : h; // Shorter header on dashboard
    cell.font = styles.headerFont;
    cell.fill = styles.headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = styles.thinBorder;
  });
  ws6.getRow(10).height = 22;

  depts.forEach((dept, idx) => {
    const rNum = 11 + idx;
    ws6.getRow(rNum).height = 18;

    // Dept
    ws6.getCell(`B${rNum}`).value = { formula: `'Department & Monthly Summaries'!B${7+idx}` };
    ws6.getCell(`B${rNum}`).font = styles.boldFont;
    ws6.getCell(`B${rNum}`).border = styles.thinBorder;

    // Hours
    ws6.getCell(`C${rNum}`).value = { formula: `'Department & Monthly Summaries'!D${7+idx}` };
    ws6.getCell(`C${rNum}`).font = styles.regularFont;
    ws6.getCell(`C${rNum}`).alignment = { horizontal: 'right' };
    ws6.getCell(`C${rNum}`).border = styles.thinBorder;
    ws6.getCell(`C${rNum}`).numFmt = '#,##0.0';

    // Cost
    ws6.getCell(`D${rNum}`).value = { formula: `'Department & Monthly Summaries'!E${7+idx}` };
    ws6.getCell(`D${rNum}`).font = styles.regularFont;
    ws6.getCell(`D${rNum}`).alignment = { horizontal: 'right' };
    ws6.getCell(`D${rNum}`).border = styles.thinBorder;
    ws6.getCell(`D${rNum}`).numFmt = '"GHS" #,##0.00';

    // Visual Indicator (Formula copying the Cost share % so we can add Excel Data Bars!)
    ws6.getCell(`E${rNum}`).value = { formula: `'Department & Monthly Summaries'!G${7+idx}` };
    ws6.getCell(`E${rNum}`).font = styles.boldFont;
    ws6.getCell(`E${rNum}`).alignment = { horizontal: 'right' };
    ws6.getCell(`E${rNum}`).border = styles.thinBorder;
    ws6.getCell(`E${rNum}`).numFmt = '0.0%';
  });

  // Table 2 on Dashboard: Staff Type Overview (Permanent vs Contract)
  ws6.getCell('G9').value = 'Staff Type Distribution';
  ws6.getCell('G9').font = styles.sectionFont;

  const staffTypeHeaders = ['Staff Type', 'Approved Hours', 'Approved Cost'];
  staffTypeHeaders.forEach((h, idx) => {
    const cell = ws6.getCell(10, 7 + idx);
    cell.value = h;
    cell.font = styles.headerFont;
    cell.fill = styles.headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = styles.thinBorder;
  });

  const staffTypes = ['Permanent', 'Contract'];
  staffTypes.forEach((type, idx) => {
    const rNum = 11 + idx;
    ws6.getRow(rNum).height = 18;

    // Staff Type
    ws6.getCell(`G${rNum}`).value = type;
    ws6.getCell(`G${rNum}`).font = styles.boldFont;
    ws6.getCell(`G${rNum}`).border = styles.thinBorder;

    // Hours (SUMIFS on Payroll Summary)
    ws6.getCell(`H${rNum}`).value = {
      formula: `SUMIFS('Payroll Summary'!$K$6:$K$20, 'Payroll Summary'!$D$6:$D$20, G${rNum})`
    };
    ws6.getCell(`H${rNum}`).font = styles.regularFont;
    ws6.getCell(`H${rNum}`).alignment = { horizontal: 'right' };
    ws6.getCell(`H${rNum}`).border = styles.thinBorder;
    ws6.getCell(`H${rNum}`).numFmt = '#,##0.0';

    // Cost (SUMIFS on Payroll Summary)
    ws6.getCell(`I${rNum}`).value = {
      formula: `SUMIFS('Payroll Summary'!$L$6:$L$20, 'Payroll Summary'!$D$6:$D$20, G${rNum})`
    };
    ws6.getCell(`I${rNum}`).font = styles.regularFont;
    ws6.getCell(`I${rNum}`).alignment = { horizontal: 'right' };
    ws6.getCell(`I${rNum}`).border = styles.thinBorder;
    ws6.getCell(`I${rNum}`).numFmt = '"GHS" #,##0.00';
  });

  // Table 3: Overtime Limit Compliance Alerts (Rows 14-17, Cols G-I)
  ws6.getCell('G14').value = 'Overtime Threshold Compliance';
  ws6.getCell('G14').font = styles.boldFont;
  
  ws6.mergeCells('G15:I15');
  ws6.getCell('G15').value = 'Employees Exceeding 40 Hrs Limit';
  ws6.getCell('G15').font = styles.italicFont;
  ws6.getCell('G15').alignment = { horizontal: 'center' };

  ws6.getCell('G16').value = 'Emp ID';
  ws6.getCell('H16').value = 'Name';
  ws6.getCell('I16').value = 'Total June OT Hrs';
  ['G16', 'H16', 'I16'].forEach(ref => {
    ws6.getCell(ref).font = styles.headerFont;
    ws6.getCell(ref).fill = styles.headerFill;
    ws6.getCell(ref).border = styles.thinBorder;
    ws6.getCell(ref).alignment = { horizontal: 'center' };
  });

  // Kwame Mensah (EMP001) total hours are June Weekday + Weekend. Link to that record.
  ws6.getCell('G17').value = { formula: `IF('Payroll Summary'!K6>'Instructions & Settings'!$G$16, 'Payroll Summary'!B6, "-")` };
  ws6.getCell('H17').value = { formula: `IF('Payroll Summary'!K6>'Instructions & Settings'!$G$16, 'Payroll Summary'!C6, "Compliant")` };
  ws6.getCell('I17').value = { formula: `IF('Payroll Summary'!K6>'Instructions & Settings'!$G$16, 'Payroll Summary'!K6, 0)` };
  
  ws6.getCell('G18').value = { formula: `IF('Payroll Summary'!K7>'Instructions & Settings'!$G$16, 'Payroll Summary'!B7, "-")` };
  ws6.getCell('H18').value = { formula: `IF('Payroll Summary'!K7>'Instructions & Settings'!$G$16, 'Payroll Summary'!C7, "Compliant")` };
  ws6.getCell('I18').value = { formula: `IF('Payroll Summary'!K7>'Instructions & Settings'!$G$16, 'Payroll Summary'!K7, 0)` };

  for (let r = 17; r <= 18; r++) {
    ['G', 'H', 'I'].forEach(col => {
      const cell = ws6.getCell(`${col}${r}`);
      cell.font = styles.regularFont;
      cell.border = styles.thinBorder;
      if (col === 'G' || col === 'I') cell.alignment = { horizontal: 'center' };
      if (col === 'I') cell.numFmt = '0.0';
    });
  }

  // Formatting for Dashboard Column Widths
  ws6.getColumn('A').width = 3;
  ws6.getColumn('B').width = 18; // Dept
  ws6.getColumn('C').width = 16; // Hours
  ws6.getColumn('D').width = 18; // Cost
  ws6.getColumn('E').width = 18; // Visual Share
  ws6.getColumn('F').width = 4;  // Gap
  ws6.getColumn('G').width = 16; // Staff Type
  ws6.getColumn('H').width = 22; // Hours
  ws6.getColumn('I').width = 22; // Cost

  // Add Data Bars formatting to Column E (Visual Share Indicator)
  ws6.addConditionalFormatting({
    ref: 'E11:E17',
    rules: [
      {
        type: 'dataBar',
        color: 'FFE87722', // Ghacem Orange accent for visual chart feel!
        cfvo: [
          { type: 'num', value: 0 },
          { type: 'num', value: 0.5 } // Scaled up to 50% max share
        ]
      }
    ]
  });

  // Compliance Highlight (Red text for non-compliant rows in Compliance alert)
  ws6.addConditionalFormatting({
    ref: 'I17:I18',
    rules: [
      {
        type: 'cellIs',
        operator: 'greaterThan',
        formulae: ['0'],
        style: {
          font: { color: 'FFFF0000', bold: true },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2E6' } }
        }
      }
    ]
  });


  // ----------------------------------------------------
  // SHEET 7: Management Report (Printable Format)
  // ----------------------------------------------------
  const ws7 = workbook.addWorksheet('Management Report');
  ws7.views = [{ showGridLines: true }];
  
  // Set page setup for standard A4 printing
  ws7.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
  };

  createTitleBanner(ws7, 'Monthly Management Overtime Report', 6);

  // Metadata Block
  ws7.getCell('B5').value = 'Report Period:';
  ws7.getCell('B5').font = styles.boldFont;
  ws7.getCell('C5').value = 'Q2 - April to June 2026';
  ws7.getCell('C5').font = styles.regularFont;

  ws7.getCell('E5').value = 'Date Generated:';
  ws7.getCell('E5').font = styles.boldFont;
  ws7.getCell('F5').value = { formula: 'TODAY()' };
  ws7.getCell('F5').font = styles.regularFont;
  ws7.getCell('F5').numFmt = 'YYYY-MM-DD';

  ws7.getCell('B6').value = 'Target Audience:';
  ws7.getCell('B6').font = styles.boldFont;
  ws7.getCell('C6').value = 'Executive Management & Payroll';
  ws7.getCell('C6').font = styles.regularFont;

  ws7.getCell('E6').value = 'Currency:';
  ws7.getCell('E6').font = styles.boldFont;
  ws7.getCell('F6').value = 'Ghanaian Cedi (GHS)';
  ws7.getCell('F6').font = styles.regularFont;

  // Draw separator line
  for(let col = 2; col <= 6; col++) {
    ws7.getCell(7, col).border = { bottom: { style: 'medium', color: { argb: colors.navy } } };
  }

  // Section 1: Executive Summary Table
  ws7.getCell('B9').value = '1. Executive Cost & Hours Summary';
  ws7.getCell('B9').font = styles.sectionFont;

  const repHeaders = ['Period', 'Total Hours Worked', 'Total Gross Spend (GHS)', 'Average Cost/Hour', 'Approval Rate'];
  repHeaders.forEach((h, idx) => {
    const cell = ws7.getCell(10, 2 + idx);
    cell.value = h;
    cell.font = styles.headerFont;
    cell.fill = styles.headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = styles.thinBorder;
  });
  ws7.getRow(10).height = 22;

  months.forEach((m, idx) => {
    const rNum = 11 + idx;
    ws7.getRow(rNum).height = 20;

    // Period
    ws7.getCell(`B${rNum}`).value = m[0];
    ws7.getCell(`B${rNum}`).font = styles.boldFont;
    ws7.getCell(`B${rNum}`).border = styles.thinBorder;

    // Hours
    ws7.getCell(`C${rNum}`).value = { formula: `'Department & Monthly Summaries'!E${19+idx}` };
    ws7.getCell(`C${rNum}`).font = styles.regularFont;
    ws7.getCell(`C${rNum}`).alignment = { horizontal: 'right' };
    ws7.getCell(`C${rNum}`).border = styles.thinBorder;
    ws7.getCell(`C${rNum}`).numFmt = '#,##0.0';

    // Spend
    ws7.getCell(`D${rNum}`).value = { formula: `'Department & Monthly Summaries'!F${19+idx}` };
    ws7.getCell(`D${rNum}`).font = styles.regularFont;
    ws7.getCell(`D${rNum}`).alignment = { horizontal: 'right' };
    ws7.getCell(`D${rNum}`).border = styles.thinBorder;
    ws7.getCell(`D${rNum}`).numFmt = '"GHS" #,##0.00';

    // Avg Cost / Hour
    ws7.getCell(`E${rNum}`).value = { formula: `D${rNum}/C${rNum}` };
    ws7.getCell(`E${rNum}`).font = styles.regularFont;
    ws7.getCell(`E${rNum}`).alignment = { horizontal: 'right' };
    ws7.getCell(`E${rNum}`).border = styles.thinBorder;
    ws7.getCell(`E${rNum}`).numFmt = '"GHS" #,##0.00';

    // Approval Rate
    ws7.getCell(`F${rNum}`).value = { formula: `'Department & Monthly Summaries'!G${19+idx}` };
    ws7.getCell(`F${rNum}`).font = styles.boldFont;
    ws7.getCell(`F${rNum}`).alignment = { horizontal: 'right' };
    ws7.getCell(`F${rNum}`).border = styles.thinBorder;
    ws7.getCell(`F${rNum}`).numFmt = '0.0%';

    if (idx % 2 === 1) {
      for (let c = 2; c <= 6; c++) {
        ws7.getCell(rNum, c).fill = styles.zebraFill;
      }
    }
  });

  // Summary Report Total Row
  ws7.getRow(14).height = 22;
  ws7.getCell('B14').value = 'Total Period';
  ws7.getCell('B14').font = styles.boldFont;
  ws7.getCell('B14').alignment = { horizontal: 'right' };
  ws7.getCell('B14').border = styles.doubleBottomBorder;
  ws7.getCell('B14').fill = styles.greyHeaderFill;

  ws7.getCell('C14').value = { formula: 'SUM(C11:C13)' };
  ws7.getCell('C14').font = styles.boldFont;
  ws7.getCell('C14').alignment = { horizontal: 'right' };
  ws7.getCell('C14').border = styles.doubleBottomBorder;
  ws7.getCell('C14').fill = styles.greyHeaderFill;
  ws7.getCell('C14').numFmt = '#,##0.0';

  ws7.getCell('D14').value = { formula: 'SUM(D11:D13)' };
  ws7.getCell('D14').font = styles.boldFont;
  ws7.getCell('D14').alignment = { horizontal: 'right' };
  ws7.getCell('D14').border = styles.doubleBottomBorder;
  ws7.getCell('D14').fill = styles.greyHeaderFill;
  ws7.getCell('D14').numFmt = '"GHS" #,##0.00';

  ws7.getCell('E14').value = { formula: 'D14/C14' };
  ws7.getCell('E14').font = styles.boldFont;
  ws7.getCell('E14').alignment = { horizontal: 'right' };
  ws7.getCell('E14').border = styles.doubleBottomBorder;
  ws7.getCell('E14').fill = styles.greyHeaderFill;
  ws7.getCell('E14').numFmt = '"GHS" #,##0.00';

  ws7.getCell('F14').value = { formula: `AVERAGE(F11:F13)` };
  ws7.getCell('F14').font = styles.boldFont;
  ws7.getCell('F14').alignment = { horizontal: 'right' };
  ws7.getCell('F14').border = styles.doubleBottomBorder;
  ws7.getCell('F14').fill = styles.greyHeaderFill;
  ws7.getCell('F14').numFmt = '0.0%';


  // Section 2: Cost Control and Risk Assessment (Text & Recommendations)
  ws7.getCell('B17').value = '2. Management Observations & Cost Controls';
  ws7.getCell('B17').font = styles.sectionFont;

  const notes = [
    '• Operations and Maintenance account for over 75% of total overtime costs. This is in line with continuous kiln run schedules.',
    '• Shift supervisor Kwame Mensah (EMP001) has exceeded the 40-hour overtime safety threshold for June (currently at 44 hours).',
    '  ACTION: Shift scheduling adjustments are recommended to prevent burnout and comply with company health & safety rules.',
    '• Contractor withholding tax is automatically calculated at 7.5% in the Payroll Summary sheet, ensuring statutory compliance.',
    '• Average Overtime rate is GHS 124.50/Hr, indicating that weekend and emergency multipliers are primary cost drivers.'
  ];

  notes.forEach((note, idx) => {
    const rNum = 18 + idx;
    ws7.mergeCells(rNum, 2, rNum, 6);
    const cell = ws7.getCell(rNum, 2);
    cell.value = note;
    cell.font = idx === 2 ? styles.boldFont : styles.regularFont; // Bold safety action
    cell.alignment = { horizontal: 'left', wrapText: true };
    
    // Highlight the safety action row in light orange
    if (idx === 2) {
      for(let col = 2; col <= 6; col++) {
        ws7.getCell(rNum, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      }
    }
  });

  // Section 3: Sign Off
  ws7.getCell('B25').value = 'Prepared By: ___________________________';
  ws7.getCell('B25').font = styles.boldFont;
  ws7.getCell('B26').value = 'HR & Payroll Operations Manager';
  ws7.getCell('B26').font = styles.italicFont;

  ws7.getCell('E25').value = 'Approved By: ___________________________';
  ws7.getCell('E25').font = styles.boldFont;
  ws7.getCell('E26').value = 'Director of Finance / Plant Manager';
  ws7.getCell('E26').font = styles.italicFont;

  // Management Report Column Widths
  ws7.getColumn('A').width = 3;
  ws7.getColumn('B').width = 22; // Period
  ws7.getColumn('C').width = 22; // Hours
  ws7.getColumn('D').width = 26; // Spend
  ws7.getColumn('E').width = 22; // Avg Cost/Hr
  ws7.getColumn('F').width = 22; // Approval Rate

  // ----------------------------------------------------
  // SAVE WORKBOOK
  // ----------------------------------------------------
  const outputPath = path.join('c:', 'Users', 'shanson', 'Downloads', 'dinesmart-suite-main', 'Ghacem_Overtime_Management_Dashboard.xlsx');
  
  console.log(`Writing file to: ${outputPath}`);
  await workbook.xlsx.writeFile(outputPath);
  console.log("Workbook generated successfully!");
}

createDashboard().catch(err => {
  console.error("Error generating dashboard:", err);
  process.exit(1);
});
