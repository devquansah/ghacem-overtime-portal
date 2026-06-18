/**
 * Modern Microsoft Office Script (TypeScript) for Excel Online.
 * This script batch approves all pending overtime requests for a specific manager
 * and updates the log. It runs directly in the cloud Excel Online viewport.
 */
function main(workbook: ExcelScript.Workbook, managerName: string) {
  // Get the RawDatabase sheet and the OvertimeTable
  const sheet = workbook.getWorksheet("RawDatabase");
  if (!sheet) {
    console.log("RawDatabase sheet not found.");
    return;
  }
  
  const table = sheet.getTable("OvertimeTable");
  if (!table) {
    console.log("OvertimeTable not found.");
    return;
  }

  // Get the range and values of the table body rows
  const range = table.getRangeBetweenHeaderAndTotal();
  if (!range) {
    console.log("No data rows found in OvertimeTable.");
    return;
  }
  
  const values = range.getValues();
  const rowCount = range.getRowCount();

  // Find column indexes (0-based) based on the table header
  const headerRange = table.getHeaderRowRange();
  const headers = headerRange.getValues()[0];
  
  const recordIdIdx = headers.indexOf("Record ID");
  const employeeIdIdx = headers.indexOf("Employee ID");
  const approvalStatusIdx = headers.indexOf("Approval Status");
  const approvedByIdx = headers.indexOf("Approved By");
  const commentsIdx = headers.indexOf("Supervisor Comments");

  if (recordIdIdx === -1 || approvalStatusIdx === -1 || approvedByIdx === -1) {
    console.log("Required table columns not found.");
    return;
  }

  console.log(`Starting batch approval process. Total rows to scan: ${rowCount}`);

  let approvedCount = 0;

  // Loop through all rows and auto-approve pending ones
  for (let i = 0; i < rowCount; i++) {
    const status = values[i][approvalStatusIdx];
    
    if (status === "Pending") {
      const recordId = values[i][recordIdIdx];
      const employeeId = values[i][employeeIdIdx];
      
      console.log(`Approving Record: ${recordId} for Employee: ${employeeId}`);
      
      // Update cell values in the table body range
      range.getCell(i, approvalStatusIdx).setValue("Approved");
      range.getCell(i, approvedByIdx).setValue(managerName);
      range.getCell(i, commentsIdx).setValue("Batch approved via Excel Office Script");
      
      approvedCount++;
    }
  }

  console.log(`Batch approval complete. Total requests approved: ${approvedCount}`);
  
  // Force workbook calculation update
  workbook.getApplication().calculate(ExcelScript.CalculationType.full);
}
