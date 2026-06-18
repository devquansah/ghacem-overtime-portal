# PowerShell script to programmatically generate the Ghacem Overtime Online Database in Excel
# This file is styled and ready to be hosted in SharePoint/OneDrive for Power Automate integration

$ErrorActionPreference = "Stop"

Write-Output "Starting Ghacem Overtime Online Database generation via Excel COM..."

# Launch Excel COM object
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.ScreenUpdating = $false

try {
    # Create Workbook
    $wb = $excel.Workbooks.Add()
    
    # Set up sheets and naming
    $wsManagement = $wb.Worksheets.Item(1)
    $wsManagement.Name = "Management Dashboard"
    
    $wsHR = $wb.Worksheets.Add()
    $wsHR.Name = "HR Dashboard"
    $wsHR.Move([System.Reflection.Missing]::Value, $wsManagement)
    
    $wsPayroll = $wb.Worksheets.Add()
    $wsPayroll.Name = "Payroll Dashboard"
    $wsPayroll.Move([System.Reflection.Missing]::Value, $wsHR)
    
    $wsSettings = $wb.Worksheets.Add()
    $wsSettings.Name = "Help & Settings"
    $wsSettings.Move([System.Reflection.Missing]::Value, $wsPayroll)
    
    $wsDatabase = $wb.Worksheets.Add()
    $wsDatabase.Name = "RawDatabase"
    $wsDatabase.Move([System.Reflection.Missing]::Value, $wsSettings)
    
    $wsEmployeeMaster = $wb.Worksheets.Add()
    $wsEmployeeMaster.Name = "EmployeeMaster"
    $wsEmployeeMaster.Move([System.Reflection.Missing]::Value, $wsDatabase)
    
    $wsCalculations = $wb.Worksheets.Add()
    $wsCalculations.Name = "Calculations"
    $wsCalculations.Move([System.Reflection.Missing]::Value, $wsEmployeeMaster)

    Write-Output "Sheets initialized."

    # Color Helper function
    # Excel BGR format: Red + Green * 256 + Blue * 65536
    function Get-RGB($r, $g, $b) {
        return $r + ($g * 256) + ($b * 65536)
    }

    $cNavy = Get-RGB 27 54 93        # #1B365D (Management theme)
    $cOrange = Get-RGB 232 119 34    # #E87722 (Accent)
    $cGreen = Get-RGB 56 124 43      # #387C2B (HR theme)
    $cPurple = Get-RGB 112 48 160    # #7030A0 (Payroll theme)
    $cWhite = Get-RGB 255 255 255
    $cLightGrey = Get-RGB 248 249 250
    $cIceBlue = Get-RGB 240 244 248
    $cBorderGrey = Get-RGB 217 217 217
    $cCharcoal = Get-RGB 51 51 51
    $cSoftGreen = Get-RGB 226 239 218 # Approved fill
    $cSoftYellow = Get-RGB 255 242 204 # Pending fill
    $cSoftRed = Get-RGB 252 228 214   # Rejected fill

    # Format-Cell Helper function
    function Format-Cell($ws, $range, $fontName="Segoe UI", $fontSize=10, $bold=$false, $italic=$false, $color=0, $bgColor=$null, $align="left", $border=$false, $numFormat=$null) {
        $r = $ws.Range($range)
        $r.Font.Name = $fontName
        $r.Font.Size = $fontSize
        $r.Font.Bold = $bold
        $r.Font.Italic = $italic
        $r.Font.Color = $color
        
        if ($bgColor -ne $null) {
            $r.Interior.Color = $bgColor
        }
        
        if ($align -eq "center") {
            $r.HorizontalAlignment = -4108 # xlCenter
        } elseif ($align -eq "right") {
            $r.HorizontalAlignment = -4152 # xlRight
        } else {
            $r.HorizontalAlignment = -4131 # xlLeft
        }
        
        if ($border) {
            # Apply thin grey borders
            for ($i = 7; $i -le 10; $i++) { # xlEdgeLeft=7, xlEdgeTop=8, xlEdgeBottom=9, xlEdgeRight=10
                $b = $r.Borders.Item($i)
                $b.LineStyle = 1 # xlContinuous
                $b.Weight = 2 # xlThin
                $b.Color = $cBorderGrey
            }
        }
        
        if ($numFormat -ne $null) {
            $r.NumberFormat = $numFormat
        }
    }

    # Create standardized banners
    function Create-Banner($ws, $title, $width, $themeColor) {
        $ws.Cells.Item(2, 2).Value2 = $title
        $ws.Range($ws.Cells.Item(2, 2), $ws.Cells.Item(2, 1 + $width)).Merge()
        Format-Cell $ws "B2" "Segoe UI" 16 $true $false $cWhite $themeColor "center"
        $ws.Rows.Item(2).RowHeight = 40
        
        # Accent line
        $ws.Range($ws.Cells.Item(3, 2), $ws.Cells.Item(3, 1 + $width)).Merge()
        $ws.Range("B3").Interior.Color = $cOrange
        $ws.Rows.Item(3).RowHeight = 4
    }

    # ----------------------------------------------------
    # SHEET: EmployeeMaster
    # ----------------------------------------------------
    Write-Output "Setting up EmployeeMaster data..."
    $wsEmployeeMaster.Cells.Item(5, 2).Value2 = "Employee ID"
    $wsEmployeeMaster.Cells.Item(5, 3).Value2 = "Full Name"
    $wsEmployeeMaster.Cells.Item(5, 4).Value2 = "Staff Type"
    $wsEmployeeMaster.Cells.Item(5, 5).Value2 = "Department"
    $wsEmployeeMaster.Cells.Item(5, 6).Value2 = "Role"
    $wsEmployeeMaster.Cells.Item(5, 7).Value2 = "Hourly Base Rate (GHS)"
    $wsEmployeeMaster.Cells.Item(5, 8).Value2 = "Manager Email"
    $wsEmployeeMaster.Cells.Item(5, 9).Value2 = "Status"
    
    $employees = @(
        @('EMP001', 'Kwame Mensah', 'Permanent', 'Operations', 'Shift Supervisor', 45.00, 'k.mensah@ghacem.com', 'Active'),
        @('EMP002', 'Abena Osei', 'Permanent', 'Operations', 'Control Operator', 50.00, 'k.mensah@ghacem.com', 'Active'),
        @('EMP003', 'Yaw Addo', 'Permanent', 'Logistics', 'Fleet Dispatcher', 42.00, 'c.oppong@ghacem.com', 'Active'),
        @('EMP004', 'Ekow Gyan', 'Permanent', 'Maintenance', 'Senior Technician', 48.00, 'a.taylor@ghacem.com', 'Active'),
        @('EMP005', 'Efua Asare', 'Permanent', 'HR', 'HR Officer', 40.00, 's.hanson@ghacem.com', 'Active'),
        @('EMP006', 'Kojo Peprah', 'Permanent', 'Finance', 'Accountant', 55.00, 's.hanson@ghacem.com', 'Active'),
        @('EMP007', 'Yaa Baah', 'Permanent', 'Safety', 'Safety Officer', 46.00, 'a.taylor@ghacem.com', 'Active'),
        @('EMP008', 'Kwaku Mensah', 'Permanent', 'Operations', 'Quarry Operator', 38.00, 'k.mensah@ghacem.com', 'Active'),
        @('EMP009', 'Adjoa Sarfo', 'Permanent', 'Logistics', 'Warehouse Sup', 44.00, 'c.oppong@ghacem.com', 'Active'),
        @('EMP010', 'Kofi Boateng', 'Permanent', 'Maintenance', 'Electrical Eng', 52.00, 'a.taylor@ghacem.com', 'Active'),
        @('CON001', 'Emmanuel Boateng', 'Contract', 'Operations', 'Packing Helper', 35.00, 'kwame.mensah@ghacem.com', 'Active'),
        @('CON002', 'Kofi Antwi', 'Contract', 'Operations', 'Driver', 32.00, 'kwame.mensah@ghacem.com', 'Active'),
        @('CON003', 'Ama Serwaa', 'Contract', 'Logistics', 'Loader', 30.00, 'y.addo@ghacem.com', 'Active'),
        @('CON004', 'Kwabena Kyeremeh', 'Contract', 'Maintenance', 'Mechanic', 36.00, 'e.gyan@ghacem.com', 'Active'),
        @('CON005', 'John Mensah', 'Contract', 'Safety', 'Fire Marshall', 33.00, 'y.baah@ghacem.com', 'Active')
    )
    
    $r = 6
    foreach ($emp in $employees) {
        for ($c = 0; $c -lt 8; $c++) {
            $val = $emp[$c]
            $cell = $wsEmployeeMaster.Cells.Item($r, 2 + $c)
            if ($val -is [double]) {
                $cell.Value2 = $val.ToString()
            } else {
                $cell.Value2 = $val
            }
        }
        $r++
    }
    # Create Table
    $tblMasterRange = $wsEmployeeMaster.Range("B5:I20")
    $tblMaster = $wsEmployeeMaster.ListObjects.Add(1, $tblMasterRange, $null, 1)
    $tblMaster.Name = "EmployeeMasterTable"
    $tblMaster.TableStyle = "TableStyleMedium2"
    
    $wsEmployeeMaster.Columns.Item(2).ColumnWidth = 15
    $wsEmployeeMaster.Columns.Item(3).ColumnWidth = 20
    $wsEmployeeMaster.Columns.Item(4).ColumnWidth = 15
    $wsEmployeeMaster.Columns.Item(5).ColumnWidth = 15
    $wsEmployeeMaster.Columns.Item(6).ColumnWidth = 20
    $wsEmployeeMaster.Columns.Item(7).ColumnWidth = 22
    $wsEmployeeMaster.Columns.Item(8).ColumnWidth = 24
    $wsEmployeeMaster.Columns.Item(9).ColumnWidth = 12

    # ----------------------------------------------------
    # SHEET: Help & Settings
    # ----------------------------------------------------
    Write-Output "Setting up configurations..."
    Create-Banner $wsSettings "System Configurations & Variables" 6 $cNavy
    
    $wsSettings.Cells.Item(5, 2).Value2 = "System Configurations & Variables"
    Format-Cell $wsSettings "B5" "Segoe UI" 12 $true $false $cNavy
    
    $wsSettings.Cells.Item(7, 2).Value2 = "Overtime Type"
    $wsSettings.Cells.Item(7, 3).Value2 = "Multiplier"
    
    $multipliers = @(
        @('Weekday', 1.5),
        @('Weekend', 2.0),
        @('Holiday', 2.5),
        @('Emergency', 3.0)
    )
    $r = 8
    foreach ($m in $multipliers) {
        $wsSettings.Cells.Item($r, 2).Value2 = $m[0]
        $wsSettings.Cells.Item($r, 3).Value2 = $m[1].ToString()
        $r++
    }
    # Create Table
    $tblSettingsRange = $wsSettings.Range("B7:C11")
    $tblSettings = $wsSettings.ListObjects.Add(1, $tblSettingsRange, $null, 1)
    $tblSettings.Name = "SettingsTable"
    $tblSettings.TableStyle = "TableStyleMedium2"
    
    $wsSettings.Cells.Item(14, 2).Value2 = "Variable Description"
    $wsSettings.Cells.Item(14, 3).Value2 = "Configured Value"
    
    $variables = @(
        @('Max Monthly OT Hours Limit', 40),
        @('Contractor Withholding Tax Rate', 0.075),
        @('Staff Average PAYE Tax Rate', 0.15)
    )
    $r = 15
    foreach ($v in $variables) {
        $wsSettings.Cells.Item($r, 2).Value2 = $v[0]
        $wsSettings.Cells.Item($r, 3).Value2 = $v[1].ToString()
        $r++
    }
    
    $wsSettings.Columns.Item(2).ColumnWidth = 30
    $wsSettings.Columns.Item(3).ColumnWidth = 20

    # ----------------------------------------------------
    # SHEET: RawDatabase (Central Database)
    # ----------------------------------------------------
    Write-Output "Pre-populating database ledger table..."
    $dbHeaders = @('Record ID', 'Date', 'Employee ID', 'Employee Name', 'Staff Type', 'Department', 'Base Rate', 'Overtime Type', 'Hours Worked', 'Multiplier', 'Overtime Pay', 'Approval Status', 'Approved By', 'Supervisor Comments', 'Shift', 'Start Time', 'End Time', 'Signature')
    for ($c = 0; $c -lt $dbHeaders.Length; $c++) {
        $wsDatabase.Cells.Item(5, 2 + $c).Value2 = $dbHeaders[$c]
    }
    
    $mockRecords = @(
        @("OTR001", "2026-04-02", "EMP001", "Weekday", 4.0, "Approved", "Sarah Hanson", "Extended shift for kiln repair", "Night Shift", "18:00", "22:00", "Kwame Mensah"),
        @("OTR002", "2026-04-03", "EMP002", "Weekday", 3.0, "Approved", "Sarah Hanson", "Late billing reconciliation", "Day Shift", "17:00", "20:00", "Abena Osei"),
        @("OTR003", "2026-04-04", "CON001", "Weekend", 6.0, "Approved", "Kwame Mensah", "Silo clearing support", "Weekend Shift", "08:00", "14:00", "Emmanuel Boateng"),
        @("OTR004", "2026-04-05", "CON002", "Weekend", 8.0, "Approved", "Kwame Mensah", "Emergency raw material delivery", "Weekend Shift", "08:00", "16:00", "Kofi Antwi"),
        @("OTR005", "2026-04-07", "EMP004", "Emergency", 5.0, "Approved", "Albert Taylor", "Electrical fault in clinker cooler", "Night Shift", "20:00", "01:00", "Ekow Gyan"),
        @("OTR006", "2026-04-10", "EMP007", "Weekday", 2.5, "Approved", "Albert Taylor", "Safety inspection after hours", "Day Shift", "17:00", "19:30", "Yaa Baah"),
        @("OTR007", "2026-04-11", "CON003", "Weekend", 6.0, "Approved", "Yaw Addo", "Bagging line packing help", "Weekend Shift", "12:00", "18:00", "Ama Serwaa"),
        @("OTR008", "2026-04-12", "CON004", "Weekend", 7.5, "Approved", "Ekow Gyan", "Scheduled conveyor belt maintenance", "Weekend Shift", "08:00", "15:30", "Kwabena Kyeremeh"),
        @("OTR009", "2026-04-14", "EMP003", "Weekday", 2.0, "Approved", "Charles Oppong", "Late truck dispatching checks", "Day Shift", "17:00", "19:00", "Yaw Addo"),
        @("OTR010", "2026-04-15", "EMP008", "Weekday", 4.0, "Rejected", "Kofi Mensah", "Unapproved overtime extension", "Day Shift", "17:00", "21:00", "Kwaku Mensah"),
        @("OTR011", "2026-04-18", "EMP009", "Weekend", 5.0, "Approved", "Charles Oppong", "Warehouse inventory count", "Weekend Shift", "08:00", "13:00", "Adjoa Sarfo"),
        @("OTR012", "2026-04-22", "CON005", "Holiday", 8.0, "Approved", "Yaa Baah", "Holiday safety standby coverage", "Day Shift", "08:00", "16:00", "John Mensah"),
        @("OTR013", "2026-05-01", "EMP001", "Holiday", 6.0, "Approved", "Kofi Mensah", "May Day plant supervisor cover", "Day Shift", "08:00", "14:00", "Kwame Mensah"),
        @("OTR014", "2026-05-02", "CON001", "Weekday", 3.5, "Approved", "Kwame Mensah", "Bagging line overflow support", "Night Shift", "18:00", "21:30", "Emmanuel Boateng"),
        @("OTR015", "2026-05-03", "EMP002", "Weekend", 8.0, "Approved", "Kofi Mensah", "Sunday system backup and maintenance", "Weekend Shift", "08:00", "16:00", "Abena Osei"),
        @("OTR016", "2026-05-05", "EMP005", "Weekday", 2.0, "Approved", "Sarah Hanson", "Employee onboarding backlog", "Day Shift", "17:00", "19:00", "Efua Asare"),
        @("OTR017", "2026-05-08", "EMP010", "Emergency", 4.5, "Approved", "Albert Taylor", "Main grid power failure response", "Night Shift", "22:00", "02:30", "Kofi Boateng"),
        @("OTR018", "2026-05-12", "CON002", "Weekday", 3.0, "Approved", "Kwame Mensah", "Evening cement dispatch transport", "Night Shift", "18:00", "21:00", "Kofi Antwi"),
        @("OTR019", "2026-05-15", "EMP006", "Weekday", 4.0, "Approved", "Sarah Hanson", "Mid-month budget preparations", "Day Shift", "17:00", "21:00", "Kojo Peprah"),
        @("OTR020", "2026-05-18", "CON003", "Weekday", 4.0, "Approved", "Yaw Addo", "Additional truck loader duties", "Day Shift", "17:00", "21:00", "Ama Serwaa"),
        @("OTR021", "2026-05-20", "EMP004", "Weekday", 3.0, "Approved", "Albert Taylor", "Pre-shift equipment inspection", "Day Shift", "05:00", "08:00", "Ekow Gyan"),
        @("OTR022", "2026-05-24", "CON004", "Weekend", 8.0, "Approved", "Ekow Gyan", "Compressor overhaul assistance", "Weekend Shift", "08:00", "16:00", "Kwabena Kyeremeh"),
        @("OTR023", "2026-05-27", "EMP008", "Weekday", 5.0, "Pending", "", "Kiln maintenance support", "Night Shift", "18:00", "23:00", "Kwaku Mensah"),
        @("OTR024", "2026-05-29", "EMP003", "Weekday", 3.0, "Approved", "Charles Oppong", "Late customer order processing", "Day Shift", "17:00", "20:00", "Yaw Addo"),
        @("OTR025", "2026-06-01", "EMP001", "Weekday", 4.0, "Approved", "Kofi Mensah", "Supervising early morning startup", "Day Shift", "04:00", "08:00", "Kwame Mensah"),
        @("OTR026", "2026-06-02", "CON001", "Weekday", 3.0, "Approved", "Kwame Mensah", "Silo packing assistant", "Night Shift", "18:00", "21:00", "Emmanuel Boateng"),
        @("OTR027", "2026-06-03", "EMP002", "Weekday", 3.5, "Approved", "Kofi Mensah", "Control room handover delay", "Day Shift", "17:00", "20:30", "Abena Osei"),
        @("OTR028", "2026-06-04", "EMP004", "Weekday", 4.5, "Approved", "Albert Taylor", "Routine crusher lubrication", "Day Shift", "17:00", "21:30", "Ekow Gyan"),
        @("OTR029", "2026-06-05", "CON004", "Weekday", 9.0, "Approved", "Ekow Gyan", "Crusher repair", "Night Shift", "17:00", "02:00", "Kwabena Kyeremeh"),
        @("OTR030", "2026-06-06", "EMP007", "Weekend", 6.0, "Approved", "Albert Taylor", "Weekend site safety verification", "Weekend Shift", "08:00", "14:00", "Yaa Baah"),
        @("OTR031", "2026-06-07", "CON002", "Weekend", 8.0, "Approved", "Kwame Mensah", "Bulk loading logistics driver", "Weekend Shift", "08:00", "16:00", "Kofi Antwi"),
        @("OTR032", "2026-06-08", "EMP010", "Weekday", 2.0, "Approved", "Albert Taylor", "Control system update monitoring", "Day Shift", "17:00", "19:00", "Kofi Boateng"),
        @("OTR033", "2026-06-09", "EMP003", "Weekday", 3.0, "Approved", "Charles Oppong", "Logistics coordination meeting", "Day Shift", "17:00", "20:00", "Yaw Addo"),
        @("OTR034", "2026-06-10", "CON003", "Weekday", 5.0, "Approved", "Yaw Addo", "Cement bag shipping duties", "Day Shift", "17:00", "22:00", "Ama Serwaa"),
        @("OTR035", "2026-06-11", "EMP009", "Weekday", 3.0, "Approved", "Charles Oppong", "Stock checks and auditing", "Day Shift", "17:00", "20:00", "Adjoa Sarfo"),
        @("OTR036", "2026-06-12", "CON005", "Emergency", 6.0, "Approved", "Yaa Baah", "Accident response & incident report", "Night Shift", "20:00", "02:00", "John Mensah"),
        @("OTR037", "2026-06-13", "EMP008", "Weekend", 8.0, "Approved", "Kofi Mensah", "Saturday quarry operations cover", "Weekend Shift", "08:00", "16:00", "Kwaku Mensah"),
        @("OTR038", "2026-06-14", "EMP001", "Weekend", 8.0, "Pending", "", "Kiln monitoring weekend shift", "Weekend Shift", "08:00", "16:00", "Kwame Mensah"),
        @("OTR039", "2026-06-15", "EMP006", "Weekday", 5.0, "Approved", "Sarah Hanson", "Tax filing and audits preparation", "Day Shift", "17:00", "22:00", "Kojo Peprah"),
        @("OTR040", "2026-06-15", "CON001", "Weekday", 4.0, "Pending", "", "Late cleaning after shift close", "Night Shift", "18:00", "22:00", "Emmanuel Boateng")
    )
    
    $r = 6
    foreach ($rec in $mockRecords) {
        $wsDatabase.Cells.Item($r, 2).Value2 = $rec[0] # Record ID
        $wsDatabase.Cells.Item($r, 3).Value2 = $rec[1] # Date
        $wsDatabase.Cells.Item($r, 4).Value2 = $rec[2] # Employee ID
        
        # Formulas using standard row indexing that translates to Excel Online
        $wsDatabase.Cells.Item($r, 5).Formula = "=XLOOKUP(D$r, EmployeeMasterTable[Employee ID], EmployeeMasterTable[Full Name], ""Unknown"")"
        $wsDatabase.Cells.Item($r, 6).Formula = "=XLOOKUP(D$r, EmployeeMasterTable[Employee ID], EmployeeMasterTable[Staff Type], ""Unknown"")"
        $wsDatabase.Cells.Item($r, 7).Formula = "=XLOOKUP(D$r, EmployeeMasterTable[Employee ID], EmployeeMasterTable[Department], ""Unknown"")"
        $wsDatabase.Cells.Item($r, 8).Formula = "=XLOOKUP(D$r, EmployeeMasterTable[Employee ID], EmployeeMasterTable[Hourly Base Rate (GHS)], 0)"
        
        $wsDatabase.Cells.Item($r, 9).Value2 = $rec[3] # Overtime Type
        
        # Time inputs
        $wsDatabase.Cells.Item($r, 17).Value2 = $rec[9] # Start Time
        $wsDatabase.Cells.Item($r, 18).Value2 = $rec[10] # End Time
        
        $wsDatabase.Cells.Item($r, 10).Formula = "=ROUND((R$r-Q$r)*24, 2)" # Hours worked formula
        $wsDatabase.Cells.Item($r, 11).Formula = "=XLOOKUP(I$r, SettingsTable[Overtime Type], SettingsTable[Multiplier], 1.0)" # Multiplier
        $wsDatabase.Cells.Item($r, 12).Formula = "=J$r * K$r * H$r" # Overtime Pay
        
        $wsDatabase.Cells.Item($r, 13).Value2 = $rec[5] # Approval Status
        $wsDatabase.Cells.Item($r, 14).Value2 = $rec[6] # Approved By
        $wsDatabase.Cells.Item($r, 15).Value2 = $rec[7] # Supervisor Comments
        $wsDatabase.Cells.Item($r, 16).Value2 = $rec[8] # Shift
        $wsDatabase.Cells.Item($r, 19).Value2 = $rec[11] # Signature
        
        $r++
    }
    # Create Excel Table
    $tblDatabaseRange = $wsDatabase.Range("B5:S45")
    $tblDatabase = $wsDatabase.ListObjects.Add(1, $tblDatabaseRange, $null, 1)
    $tblDatabase.Name = "OvertimeTable"
    $tblDatabase.TableStyle = "TableStyleMedium2"
    
    # Enable number formatting on DB columns
    $wsDatabase.Range("H6:H45").NumberFormat = '"GHS" #,##0.00'
    $wsDatabase.Range("K6:K45").NumberFormat = '0.0"x"'
    $wsDatabase.Range("L6:L45").NumberFormat = '"GHS" #,##0.00'
    $wsDatabase.Range("C6:C45").NumberFormat = 'YYYY-MM-DD'
    $wsDatabase.Range("J6:J45").NumberFormat = '0.0'
    
    $wsDatabase.Columns.Item(2).ColumnWidth = 14 # ID
    $wsDatabase.Columns.Item(3).ColumnWidth = 14 # Date
    $wsDatabase.Columns.Item(4).ColumnWidth = 14 # Emp ID
    $wsDatabase.Columns.Item(5).ColumnWidth = 20 # Name
    $wsDatabase.Columns.Item(6).ColumnWidth = 14 # Category
    $wsDatabase.Columns.Item(7).ColumnWidth = 16 # Dept
    $wsDatabase.Columns.Item(8).ColumnWidth = 16 # Rate
    $wsDatabase.Columns.Item(9).ColumnWidth = 16 # OT Type
    $wsDatabase.Columns.Item(10).ColumnWidth = 14 # Hours
    $wsDatabase.Columns.Item(11).ColumnWidth = 12 # Multiplier
    $wsDatabase.Columns.Item(12).ColumnWidth = 18 # Pay
    $wsDatabase.Columns.Item(13).ColumnWidth = 16 # Status
    $wsDatabase.Columns.Item(14).ColumnWidth = 16 # Reviewer
    $wsDatabase.Columns.Item(15).ColumnWidth = 24 # Comments
    $wsDatabase.Columns.Item(16).ColumnWidth = 14 # Shift
    $wsDatabase.Columns.Item(17).ColumnWidth = 12 # Start
    $wsDatabase.Columns.Item(18).ColumnWidth = 12 # End
    $wsDatabase.Columns.Item(19).ColumnWidth = 20 # Signature

    # ----------------------------------------------------
    # SHEET: HR Dashboard
    # ----------------------------------------------------
    Write-Output "Designing HR Dashboard..."
    Create-Banner $wsHR "HR Overtime Monitoring & Audits" 10 $cGreen
    
    $wsHR.Cells.Item(5, 2).Value2 = "CENTRAL AUDIT LOG"
    Format-Cell $wsHR "B5" "Segoe UI" 12 $true $false $cGreen
    
    # Column headers for HR view
    $hrHeaders = @('Record ID', 'Date', 'Employee ID', 'Employee Name', 'Department', 'Hours Worked', 'Overtime Pay', 'Approval Status', 'Approved By', 'Reason')
    for ($c = 0; $c -lt $hrHeaders.Length; $c++) {
        $wsHR.Cells.Item(6, 2 + $c).Value2 = $hrHeaders[$c]
    }
    
    # Bind directly to RawDatabase via Excel formulas to keep HR sheet synchronized
    for ($i = 0; $i -lt 40; $i++) {
        $row = 7 + $i
        $dbRow = 6 + $i
        $wsHR.Cells.Item($row, 2).Formula = "=RawDatabase!B$dbRow"
        $wsHR.Cells.Item($row, 3).Formula = "=RawDatabase!C$dbRow"
        $wsHR.Cells.Item($row, 4).Formula = "=RawDatabase!D$dbRow"
        $wsHR.Cells.Item($row, 5).Formula = "=RawDatabase!E$dbRow"
        $wsHR.Cells.Item($row, 6).Formula = "=RawDatabase!G$dbRow"
        $wsHR.Cells.Item($row, 7).Formula = "=RawDatabase!J$dbRow"
        $wsHR.Cells.Item($row, 8).Formula = "=RawDatabase!L$dbRow"
        $wsHR.Cells.Item($row, 9).Formula = "=RawDatabase!M$dbRow"
        $wsHR.Cells.Item($row, 10).Formula = "=RawDatabase!N$dbRow"
        $wsHR.Cells.Item($row, 11).Formula = "=RawDatabase!O$dbRow"
    }
    
    # Create Table on HR
    $tblHRRange = $wsHR.Range("B6:K46")
    $tblHR = $wsHR.ListObjects.Add(1, $tblHRRange, $null, 1)
    $tblHR.Name = "HRMonitoringTable"
    $tblHR.TableStyle = "TableStyleMedium3" # Green style
    
    $wsHR.Range("C7:C46").NumberFormat = 'YYYY-MM-DD'
    $wsHR.Range("G7:G46").NumberFormat = '0.0'
    $wsHR.Range("H7:H46").NumberFormat = '"GHS" #,##0.00'
    
    $wsHR.Columns.Item(2).ColumnWidth = 14 # ID
    $wsHR.Columns.Item(3).ColumnWidth = 14 # Date
    $wsHR.Columns.Item(4).ColumnWidth = 14 # Emp ID
    $wsHR.Columns.Item(5).ColumnWidth = 20 # Name
    $wsHR.Columns.Item(6).ColumnWidth = 16 # Dept
    $wsHR.Columns.Item(7).ColumnWidth = 14 # Hours
    $wsHR.Columns.Item(8).ColumnWidth = 18 # Pay
    $wsHR.Columns.Item(9).ColumnWidth = 16 # Status
    $wsHR.Columns.Item(10).ColumnWidth = 16 # Approved By
    $wsHR.Columns.Item(11).ColumnWidth = 26 # Reason

    # Apply conditional formatting on HR Status Column (Column J in absolute coordinates = Column 9 in Table)
    # xlCellValue = 1, xlEqual = 3
    $condApproved = $wsHR.Range("J7:J46").FormatConditions.Add(1, 3, "Approved")
    $condApproved.Interior.Color = $cSoftGreen
    $condApproved.Font.Color = Get-RGB 55 86 35 # Dark Green
    
    $condPending = $wsHR.Range("J7:J46").FormatConditions.Add(1, 3, "Pending")
    $condPending.Interior.Color = $cSoftYellow
    $condPending.Font.Color = Get-RGB 127 96 0 # Dark Yellow
    
    $condRejected = $wsHR.Range("J7:J46").FormatConditions.Add(1, 3, "Rejected")
    $condRejected.Interior.Color = $cSoftRed
    $condRejected.Font.Color = Get-RGB 198 89 17 # Dark Red

    # ----------------------------------------------------
    # SHEET: Payroll Dashboard (Purple Theme)
    # ----------------------------------------------------
    Write-Output "Designing Payroll Dashboard..."
    Create-Banner $wsPayroll "Payroll Overtime Processing & Tax Summary (June 2026)" 10 $cPurple
    
    $payHeaders = @(
        'Employee ID', 'Full Name', 'Staff Type', 'Department', 'Hourly Rate',
        'Approved OT Hours', 'Total OT Pay (Gross GHS)', 'Tax Rate', 'Tax Deduction (GHS)', 'Net OT Pay (GHS)'
    )
    for ($c = 0; $c -lt $payHeaders.Length; $c++) {
        $wsPayroll.Cells.Item(5, 2 + $c).Value2 = $payHeaders[$c]
    }
    
    # Generate formulas for 15 Employee rows in Payroll
    for ($i = 0; $i -lt 15; $i++) {
        $row = 6 + $i
        $wsPayroll.Cells.Item($row, 2).Formula = "=EmployeeMaster!B$(6+$i)"
        $wsPayroll.Cells.Item($row, 3).Formula = "=XLOOKUP(B$row, EmployeeMasterTable[Employee ID], EmployeeMasterTable[Full Name], """")"
        $wsPayroll.Cells.Item($row, 4).Formula = "=XLOOKUP(B$row, EmployeeMasterTable[Employee ID], EmployeeMasterTable[Staff Type], """")"
        $wsPayroll.Cells.Item($row, 5).Formula = "=XLOOKUP(B$row, EmployeeMasterTable[Employee ID], EmployeeMasterTable[Department], """")"
        $wsPayroll.Cells.Item($row, 6).Formula = "=XLOOKUP(B$row, EmployeeMasterTable[Employee ID], EmployeeMasterTable[Hourly Base Rate (GHS)], 0)"
        
        # SUMIFS referencing OvertimeTable in RawDatabase
        $wsPayroll.Cells.Item($row, 7).Formula = "=SUMIFS(OvertimeTable[Hours Worked], OvertimeTable[Employee ID], B$row, OvertimeTable[Approval Status], ""Approved"", OvertimeTable[Date], "">=2026-06-01"", OvertimeTable[Date], ""<=2026-06-30"")"
        $wsPayroll.Cells.Item($row, 8).Formula = "=SUMIFS(OvertimeTable[Overtime Pay], OvertimeTable[Employee ID], B$row, OvertimeTable[Approval Status], ""Approved"", OvertimeTable[Date], "">=2026-06-01"", OvertimeTable[Date], ""<=2026-06-30"")"
        
        # Tax rates variables
        $wsPayroll.Cells.Item($row, 9).Formula = "=IF(D$row=""Contract"", 'Help & Settings'!`$C`$16, 'Help & Settings'!`$C`$17)"
        $wsPayroll.Cells.Item($row, 10).Formula = "=H$row * I$row"
        $wsPayroll.Cells.Item($row, 11).Formula = "=H$row - J$row"
    }
    
    # Create Table on Payroll
    $tblPayrollRange = $wsPayroll.Range("B5:K20")
    $tblPayroll = $wsPayroll.ListObjects.Add(1, $tblPayrollRange, $null, 1)
    $tblPayroll.Name = "PayrollSummaryTable"
    $tblPayroll.TableStyle = "TableStyleMedium4" # Purple theme
    
    $wsPayroll.Range("F6:F20").NumberFormat = '"GHS" #,##0.00'
    $wsPayroll.Range("G6:G20").NumberFormat = '0.0'
    $wsPayroll.Range("H6:H20").NumberFormat = '"GHS" #,##0.00'
    $wsPayroll.Range("I6:I20").NumberFormat = '0.0%'
    $wsPayroll.Range("J6:J20").NumberFormat = '"GHS" #,##0.00'
    $wsPayroll.Range("K6:K20").NumberFormat = '"GHS" #,##0.00'
    
    $wsPayroll.Columns.Item(2).ColumnWidth = 14 # ID
    $wsPayroll.Columns.Item(3).ColumnWidth = 20 # Name
    $wsPayroll.Columns.Item(4).ColumnWidth = 14 # Category
    $wsPayroll.Columns.Item(5).ColumnWidth = 16 # Dept
    $wsPayroll.Columns.Item(6).ColumnWidth = 16 # Rate
    $wsPayroll.Columns.Item(7).ColumnWidth = 18 # Hours
    $wsPayroll.Columns.Item(8).ColumnWidth = 22 # Gross Pay
    $wsPayroll.Columns.Item(9).ColumnWidth = 12 # Tax Rate
    $wsPayroll.Columns.Item(10).ColumnWidth = 18 # Tax Dec
    $wsPayroll.Columns.Item(11).ColumnWidth = 22 # Net Pay

    # ----------------------------------------------------
    # SHEET: Calculations (Intermediate Chart Feeds - Hidden)
    # ----------------------------------------------------
    Write-Output "Populating Intermediate Calculations..."
    
    # Table 1: Department Cost share
    $wsCalculations.Cells.Item(4, 1).Value2 = "Department"
    $wsCalculations.Cells.Item(4, 2).Value2 = "Cost"
    $depts = @('Operations', 'Logistics', 'Maintenance', 'HR', 'Finance', 'Safety', 'Sales')
    $r = 5
    foreach ($dept in $depts) {
        $wsCalculations.Cells.Item($r, 1).Value2 = $dept
        $wsCalculations.Cells.Item($r, 2).Formula = "=SUMIFS(OvertimeTable[Overtime Pay], OvertimeTable[Department], A$r, OvertimeTable[Approval Status], ""Approved"")"
        $r++
    }
    
    # Table 2: Monthly Trends
    $wsCalculations.Cells.Item(14, 1).Value2 = "Month"
    $wsCalculations.Cells.Item(14, 2).Value2 = "Hours"
    $wsCalculations.Cells.Item(14, 3).Value2 = "Cost"
    
    $wsCalculations.Cells.Item(15, 1).Value2 = "April 2026"
    $wsCalculations.Cells.Item(15, 2).Formula = "=SUMIFS(OvertimeTable[Hours Worked], OvertimeTable[Date], "">=2026-04-01"", OvertimeTable[Date], ""<=2026-04-30"", OvertimeTable[Approval Status], ""Approved"")"
    $wsCalculations.Cells.Item(15, 3).Formula = "=SUMIFS(OvertimeTable[Overtime Pay], OvertimeTable[Date], "">=2026-04-01"", OvertimeTable[Date], ""<=2026-04-30"", OvertimeTable[Approval Status], ""Approved"")"
    
    $wsCalculations.Cells.Item(16, 1).Value2 = "May 2026"
    $wsCalculations.Cells.Item(16, 2).Formula = "=SUMIFS(OvertimeTable[Hours Worked], OvertimeTable[Date], "">=2026-05-01"", OvertimeTable[Date], ""<=2026-05-31"", OvertimeTable[Approval Status], ""Approved"")"
    $wsCalculations.Cells.Item(16, 3).Formula = "=SUMIFS(OvertimeTable[Overtime Pay], OvertimeTable[Date], "">=2026-05-01"", OvertimeTable[Date], ""<=2026-05-31"", OvertimeTable[Approval Status], ""Approved"")"
    
    $wsCalculations.Cells.Item(17, 1).Value2 = "June 2026"
    $wsCalculations.Cells.Item(17, 2).Formula = "=SUMIFS(OvertimeTable[Hours Worked], OvertimeTable[Date], "">=2026-06-01"", OvertimeTable[Date], ""<=2026-06-30"", OvertimeTable[Approval Status], ""Approved"")"
    $wsCalculations.Cells.Item(17, 3).Formula = "=SUMIFS(OvertimeTable[Overtime Pay], OvertimeTable[Date], "">=2026-06-01"", OvertimeTable[Date], ""<=2026-06-30"", OvertimeTable[Approval Status], ""Approved"")"
    
    # Table 3: Staff vs Contract
    $wsCalculations.Cells.Item(21, 1).Value2 = "Staff Type"
    $wsCalculations.Cells.Item(21, 2).Value2 = "Hours"
    $wsCalculations.Cells.Item(21, 3).Value2 = "Cost"
    
    $wsCalculations.Cells.Item(22, 1).Value2 = "Permanent"
    $wsCalculations.Cells.Item(22, 2).Formula = "=SUMIFS(OvertimeTable[Hours Worked], OvertimeTable[Staff Type], A22, OvertimeTable[Approval Status], ""Approved"")"
    $wsCalculations.Cells.Item(22, 3).Formula = "=SUMIFS(OvertimeTable[Overtime Pay], OvertimeTable[Staff Type], A22, OvertimeTable[Approval Status], ""Approved"")"
    
    $wsCalculations.Cells.Item(23, 1).Value2 = "Contract"
    $wsCalculations.Cells.Item(23, 2).Formula = "=SUMIFS(OvertimeTable[Hours Worked], OvertimeTable[Staff Type], A23, OvertimeTable[Approval Status], ""Approved"")"
    $wsCalculations.Cells.Item(23, 3).Formula = "=SUMIFS(OvertimeTable[Overtime Pay], OvertimeTable[Staff Type], A23, OvertimeTable[Approval Status], ""Approved"")"
    
    # Table 4: Top Employee Earners
    $wsCalculations.Cells.Item(26, 1).Value2 = "Employee Name"
    $wsCalculations.Cells.Item(26, 2).Value2 = "Approved Cost"
    for ($i = 0; $i -lt 15; $i++) {
        $row = 27 + $i
        $wsCalculations.Cells.Item($row, 1).Formula = "=EmployeeMaster!C$(6+$i)" # Full Name
        $wsCalculations.Cells.Item($row, 2).Formula = "=SUMIFS(OvertimeTable[Overtime Pay], OvertimeTable[Employee Name], A$row, OvertimeTable[Approval Status], ""Approved"")"
    }

    # ----------------------------------------------------
    # SHEET: Management Dashboard (Navy & Gold Theme)
    # ----------------------------------------------------
    Write-Output "Designing Management Dashboard & charts..."
    Create-Banner $wsManagement "Executive Management Dashboard" 12 $cNavy
    
    # KPI Cards Row 5-6
    # Card 1: Total OT Hours (Approved) (B5:C6)
    $wsManagement.Range("B5:C5").Merge()
    $wsManagement.Cells.Item(5, 2).Value2 = "TOTAL OT HOURS"
    Format-Cell $wsManagement "B5" "Segoe UI" 9 $true $false $cCharcoal $cLightGrey "center"
    
    $wsManagement.Range("B6:C6").Merge()
    $wsManagement.Cells.Item(6, 2).Formula = "=SUMIFS(OvertimeTable[Hours Worked], OvertimeTable[Approval Status], ""Approved"")"
    Format-Cell $wsManagement "B6" "Segoe UI" 14 $true $false $cNavy $cLightGrey "center" $false "#,##0.0"
    
    # Card 2: Total OT Cost (Approved) (D5:E6)
    $wsManagement.Range("D5:E5").Merge()
    $wsManagement.Cells.Item(5, 4).Value2 = "TOTAL OT COST"
    Format-Cell $wsManagement "D5" "Segoe UI" 9 $true $false $cCharcoal $cLightGrey "center"
    
    $wsManagement.Range("D6:E6").Merge()
    $wsManagement.Cells.Item(6, 4).Formula = "=SUMIFS(OvertimeTable[Overtime Pay], OvertimeTable[Approval Status], ""Approved"")"
    Format-Cell $wsManagement "D6" "Segoe UI" 14 $true $false $cNavy $cLightGrey "center" $false '"GHS" #,##0.00'
 
    # Card 3: Staff OT Hours (F5:G6)
    $wsManagement.Range("F5:G5").Merge()
    $wsManagement.Cells.Item(5, 6).Value2 = "STAFF OT HOURS"
    Format-Cell $wsManagement "F5" "Segoe UI" 9 $true $false $cCharcoal $cLightGrey "center"
    
    $wsManagement.Range("F6:G6").Merge()
    $wsManagement.Cells.Item(6, 6).Formula = "=Calculations!B22"
    Format-Cell $wsManagement "F6" "Segoe UI" 14 $true $false $cNavy $cLightGrey "center" $false "#,##0.0"
 
    # Card 4: Contract OT Hours (H5:I6)
    $wsManagement.Range("H5:I5").Merge()
    $wsManagement.Cells.Item(5, 8).Value2 = "CONTRACT OT HOURS"
    Format-Cell $wsManagement "H5" "Segoe UI" 9 $true $false $cCharcoal $cLightGrey "center"
    
    $wsManagement.Range("H6:I6").Merge()
    $wsManagement.Cells.Item(6, 8).Formula = "=Calculations!B23"
    Format-Cell $wsManagement "H6" "Segoe UI" 14 $true $false $cNavy $cLightGrey "center" $false "#,##0.0"
 
    # Card 5: Pending Approvals (J5:K6)
    $wsManagement.Range("J5:K5").Merge()
    $wsManagement.Cells.Item(5, 10).Value2 = "PENDING APPROVALS"
    Format-Cell $wsManagement "J5" "Segoe UI" 9 $true $false $cCharcoal $cLightGrey "center"
    
    $wsManagement.Range("J6:K6").Merge()
    $wsManagement.Cells.Item(6, 10).Formula = "=COUNTIFS(OvertimeTable[Approval Status], ""Pending"")"
    Format-Cell $wsManagement "J6" "Segoe UI" 14 $true $false $cOrange $cLightGrey "center" $false "0"
 
    # Card 6: Top Department (L5:M6)
    $wsManagement.Range("L5:M5").Merge()
    $wsManagement.Cells.Item(5, 12).Value2 = "TOP DEPARTMENT"
    Format-Cell $wsManagement "L5" "Segoe UI" 9 $true $false $cCharcoal $cLightGrey "center"
    
    $wsManagement.Range("L6:M6").Merge()
    $wsManagement.Cells.Item(6, 12).Value2 = "Operations" # Hardcoded most active dept
    Format-Cell $wsManagement "L6" "Segoe UI" 11 $true $false $cNavy $cLightGrey "center"

    # Apply double outlines to dashboard KPI cards
    $kpiRanges = @("B5:C6", "D5:E6", "F5:G6", "H5:I6", "J5:K6", "L5:M6")
    foreach ($kRange in $kpiRanges) {
        $r = $wsManagement.Range($kRange)
        for ($i = 7; $i -le 10; $i++) {
            $b = $r.Borders.Item($i)
            $b.LineStyle = 1
            $b.Weight = 3 # xlMedium = 3
            $b.Color = $cNavy
        }
    }

    # Add 4 Native Charts
    Write-Output "Adding native charts..."
    $charts = $wsManagement.ChartObjects()

    # Chart 1: Monthly OT Trend (Line Chart)
    # Position: Left 40, Top 140, Width 380, Height 240
    $c1Obj = $charts.Add(40, 140, 380, 240)
    $c1 = $c1Obj.Chart
    $c1.ChartType = 4 # xlLine = 4
    $c1.SetSourceData($wsCalculations.Range("A14:C17"))
    $c1.HasTitle = $true
    $c1.ChartTitle.Text = "Monthly Hours vs Cost Trend"
    $c1.ChartTitle.Font.Name = "Segoe UI"
    $c1.ChartTitle.Font.Size = 11

    # Chart 2: Department OT Cost (Horizontal Bar Chart)
    # Position: Left 460, Top 140, Width 380, Height 240
    $c2Obj = $charts.Add(460, 140, 380, 240)
    $c2 = $c2Obj.Chart
    $c2.ChartType = 57 # xlBarClustered = 57
    $c2.SetSourceData($wsCalculations.Range("A4:B11"))
    $c2.HasTitle = $true
    $c2.ChartTitle.Text = "Approved OT Cost by Department (GHS)"
    $c2.ChartTitle.Font.Name = "Segoe UI"
    $c2.ChartTitle.Font.Size = 11

    # Chart 3: Staff vs Contract Worker (Column Chart)
    # Position: Left 40, Top 410, Width 380, Height 240
    $c3Obj = $charts.Add(40, 410, 380, 240)
    $c3 = $c3Obj.Chart
    $c3.ChartType = 51 # xlColumnClustered = 51
    $c3.SetSourceData($wsCalculations.Range("A21:C23"))
    $c3.HasTitle = $true
    $c3.ChartTitle.Text = "OT Distribution: Staff vs Contractors"
    $c3.ChartTitle.Font.Name = "Segoe UI"
    $c3.ChartTitle.Font.Size = 11

    # Chart 4: Top Overtime Earners (Bar Chart)
    # Position: Left 460, Top 410, Width 380, Height 240
    $c4Obj = $charts.Add(460, 410, 380, 240)
    $c4 = $c4Obj.Chart
    $c4.ChartType = 57 # xlBarClustered = 57
    $c4.SetSourceData($wsCalculations.Range("A26:B41"))
    $c4.HasTitle = $true
    $c4.ChartTitle.Text = "Approved Overtime Spend by Employee"
    $c4.ChartTitle.Font.Name = "Segoe UI"
    $c4.ChartTitle.Font.Size = 11

    Write-Output "Charts created."

    # Set calculations worksheet to be hidden
    $wsCalculations.Visible = 0 # xlSheetHidden = 0
    Write-Output "Calculations sheet hidden."

    # Force Excel to calculate formulas to initialize values
    $excel.Calculate()

    # Save as xlOpenXMLWorkbook = 51 (.xlsx)
    $outputPath = "c:\Users\shanson\Downloads\dinesmart-suite-main\Ghacem_Overtime_Online_Database.xlsx"
    $wb.SaveAs($outputPath, 51)
    Write-Output "Online Database saved successfully to: $outputPath"

} catch {
    Write-Output "Error occurred during online database creation:"
    Write-Output $_.Exception.Message
    exit 1
} finally {
    # Close workbook & quit Excel
    if ($wb -ne $null) { $wb.Close($false) }
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}

Write-Output "Ghacem Overtime Online Database generation complete!"
