# PowerShell script to programmatically generate the Ghacem Overtime Portal in Excel using COM Automation

$ErrorActionPreference = "Stop"

Write-Output "Starting Ghacem Overtime Portal generation via Excel COM..."

# 1. Enable programmatic access to VBA Project model temporarily
$RegPath = "HKCU:\Software\Microsoft\Office\16.0\Excel\Security"
if (!(Test-Path $RegPath)) {
    New-Item -Path $RegPath -Force | Out-Null
}
$OldAccessVBOM = (Get-ItemProperty -Path $RegPath -Name "AccessVBOM" -ErrorAction SilentlyContinue).AccessVBOM
Set-ItemProperty -Path $RegPath -Name "AccessVBOM" -Value 1 -Force
Write-Output "VBA Trust access enabled."

# 2. Launch Excel COM object
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.ScreenUpdating = $false

try {
    # 3. Create Workbook
    $wb = $excel.Workbooks.Add()
    
    # 4. Set up sheets and naming
    $wsHome = $wb.Worksheets.Item(1)
    $wsHome.Name = "Home"
    
    $wsRequest = $wb.Worksheets.Add()
    $wsRequest.Name = "Request Form"
    $wsRequest.Move([System.Reflection.Missing]::Value, $wsHome)
    
    $wsApproval = $wb.Worksheets.Add()
    $wsApproval.Name = "Approval Center"
    $wsApproval.Move([System.Reflection.Missing]::Value, $wsRequest)
    
    $wsPayroll = $wb.Worksheets.Add()
    $wsPayroll.Name = "Payroll Dashboard"
    $wsPayroll.Move([System.Reflection.Missing]::Value, $wsApproval)
    
    $wsManagement = $wb.Worksheets.Add()
    $wsManagement.Name = "Management Dashboard"
    $wsManagement.Move([System.Reflection.Missing]::Value, $wsPayroll)
    
    $wsSettings = $wb.Worksheets.Add()
    $wsSettings.Name = "Help & Settings"
    $wsSettings.Move([System.Reflection.Missing]::Value, $wsManagement)
    
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

    # 5. Color Helper function
    # Excel BGR format: Red + Green * 256 + Blue * 65536
    function Get-RGB($r, $g, $b) {
        return $r + ($g * 256) + ($b * 65536)
    }

    $cNavy = Get-RGB 27 54 93        # #1B365D
    $cOrange = Get-RGB 232 119 34    # #E87722
    $cGreen = Get-RGB 56 124 43      # #387C2B
    $cPurple = Get-RGB 112 48 160    # #7030A0
    $cWhite = Get-RGB 255 255 255
    $cLightGrey = Get-RGB 248 249 250
    $cIceBlue = Get-RGB 240 244 248
    $cBorderGrey = Get-RGB 217 217 217
    $cCharcoal = Get-RGB 51 51 51
    $cSoftGreen = Get-RGB 226 239 218 # Approved fill
    $cSoftYellow = Get-RGB 255 242 204 # Pending fill
    $cSoftRed = Get-RGB 252 228 214   # Rejected fill

    # 6. Format-Cell Helper function
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

    # 7. Create standardized banners
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
    # SHEET: EmployeeMaster (Hidden database of personnel)
    # ----------------------------------------------------
    Write-Output "Setting up EmployeeMaster data..."
    $wsEmployeeMaster.Cells.Item(5, 2).Value2 = "Employee ID"
    $wsEmployeeMaster.Cells.Item(5, 3).Value2 = "Full Name"
    $wsEmployeeMaster.Cells.Item(5, 4).Value2 = "Staff Type"
    $wsEmployeeMaster.Cells.Item(5, 5).Value2 = "Department"
    $wsEmployeeMaster.Cells.Item(5, 6).Value2 = "Role"
    $wsEmployeeMaster.Cells.Item(5, 7).Value2 = "Hourly Base Rate (GHS)"
    $wsEmployeeMaster.Cells.Item(5, 8).Value2 = "Direct Manager"
    $wsEmployeeMaster.Cells.Item(5, 9).Value2 = "Email"
    $wsEmployeeMaster.Cells.Item(5, 10).Value2 = "Status"
    
    $employees = @(
        @('EMP001', 'Kwame Mensah', 'Permanent', 'Operations', 'Shift Supervisor', 45.00, 'Kofi Mensah', 'k.mensah@ghacem.com', 'Active'),
        @('EMP002', 'Abena Osei', 'Permanent', 'Operations', 'Control Operator', 50.00, 'Kofi Mensah', 'a.osei@ghacem.com', 'Active'),
        @('EMP003', 'Yaw Addo', 'Permanent', 'Logistics', 'Fleet Dispatcher', 42.00, 'Charles Oppong', 'y.addo@ghacem.com', 'Active'),
        @('EMP004', 'Ekow Gyan', 'Permanent', 'Maintenance', 'Senior Technician', 48.00, 'Albert Taylor', 'e.gyan@ghacem.com', 'Active'),
        @('EMP005', 'Efua Asare', 'Permanent', 'HR', 'HR Officer', 40.00, 'Sarah Hanson', 'e.asare@ghacem.com', 'Active'),
        @('EMP006', 'Kojo Peprah', 'Permanent', 'Finance', 'Accountant', 55.00, 'Sarah Hanson', 'k.peprah@ghacem.com', 'Active'),
        @('EMP007', 'Yaa Baah', 'Permanent', 'Safety', 'Safety Officer', 46.00, 'Albert Taylor', 'y.baah@ghacem.com', 'Active'),
        @('EMP008', 'Kwaku Mensah', 'Permanent', 'Operations', 'Quarry Operator', 38.00, 'Kofi Mensah', 'kw.mensah@ghacem.com', 'Active'),
        @('EMP009', 'Adjoa Sarfo', 'Permanent', 'Logistics', 'Warehouse Sup', 44.00, 'Charles Oppong', 'a.sarfo@ghacem.com', 'Active'),
        @('EMP010', 'Kofi Boateng', 'Permanent', 'Maintenance', 'Electrical Eng', 52.00, 'Albert Taylor', 'k.boateng@ghacem.com', 'Active'),
        @('CON001', 'Emmanuel Boateng', 'Contract', 'Operations', 'Packing Helper', 35.00, 'Kwame Mensah', 'e.boateng@contractor.com', 'Active'),
        @('CON002', 'Kofi Antwi', 'Contract', 'Operations', 'Driver', 32.00, 'Kwame Mensah', 'k.antwi@contractor.com', 'Active'),
        @('CON003', 'Ama Serwaa', 'Contract', 'Logistics', 'Loader', 30.00, 'Yaw Addo', 'a.serwaa@contractor.com', 'Active'),
        @('CON004', 'Kwabena Kyeremeh', 'Contract', 'Maintenance', 'Mechanic', 36.00, 'Ekow Gyan', 'k.kyeremeh@contractor.com', 'Active'),
        @('CON005', 'John Mensah', 'Contract', 'Safety', 'Fire Marshall', 33.00, 'Yaa Baah', 'j.mensah@contractor.com', 'Active')
    )
    
    $r = 6
    foreach ($emp in $employees) {
        Write-Output "Writing employee: $($emp[0]) - $($emp[1])"
        for ($c = 0; $c -lt 9; $c++) {
            $val = $emp[$c]
            Write-Output "  Col $(2+$c) type: $($val.GetType().FullName) value: $val"
            $cell = $wsEmployeeMaster.Cells.Item($r, 2 + $c)
            if ($val -is [double]) {
                $cell.Value = $val.ToString()
            } else {
                $cell.Value = $val
            }
        }
        $r++
    }

    # ----------------------------------------------------
    # SHEET: Help & Settings (Config settings)
    # ----------------------------------------------------
    Write-Output "Setting up configurations..."
    Create-Banner $wsSettings "System Instructions & Configurations" 6 $cNavy
    
    $wsSettings.Cells.Item(5, 2).Value = "System Configurations & Variables"
    Format-Cell $wsSettings "B5" "Segoe UI" 12 $true $false $cNavy
    
    # Overtime Multipliers
    $wsSettings.Cells.Item(7, 2).Value = "Overtime Type"
    $wsSettings.Cells.Item(7, 3).Value = "Multiplier"
    Format-Cell $wsSettings "B7:C7" "Segoe UI" 10 $true $false $cWhite $cNavy "center"
    
    $multipliers = @(
        @('Weekday', 1.5),
        @('Weekend', 2.0),
        @('Holiday', 2.5),
        @('Emergency', 3.0)
    )
    $r = 16 # Map to rows 16 to 19 to match dropdown formula references
    foreach ($m in $multipliers) {
        $wsSettings.Cells.Item($r, 2).Value = $m[0]
        $wsSettings.Cells.Item($r, 3).Value = $m[1].ToString()
        Format-Cell $wsSettings "B$r" "Segoe UI" 10 $true $false $cCharcoal $null "left" $true
        Format-Cell $wsSettings "C$r" "Segoe UI" 10 $false $false $cCharcoal $null "right" $true '0.0"x"'
        $r++
    }
    
    # Other System Variables
    $wsSettings.Cells.Item(7, 5).Value = "Variable Description"
    $wsSettings.Cells.Item(7, 7).Value = "Configured Value"
    Format-Cell $wsSettings "E7:G7" "Segoe UI" 10 $true $false $cWhite $cNavy "center"
    
    # Target Row variables mapped to 16, 17, 18
    $wsSettings.Cells.Item(16, 5).Value = "Max Monthly OT Hours Limit"
    $wsSettings.Cells.Item(16, 7).Value = "40"
    Format-Cell $wsSettings "E16:F16" "Segoe UI" 10 $true $false $cCharcoal $null "left" $true
    Format-Cell $wsSettings "G16" "Segoe UI" 10 $false $false $cCharcoal $null "right" $true "0"
    
    $wsSettings.Cells.Item(17, 5).Value = "Contractor Withholding Tax Rate"
    $wsSettings.Cells.Item(17, 7).Value = "0.075"
    Format-Cell $wsSettings "E17:F17" "Segoe UI" 10 $true $false $cCharcoal $null "left" $true
    Format-Cell $wsSettings "G17" "Segoe UI" 10 $false $false $cCharcoal $null "right" $true "0.0%"
    
    $wsSettings.Cells.Item(18, 5).Value = "Staff Average PAYE Tax Rate"
    $wsSettings.Cells.Item(18, 7).Value = "0.15"
    Format-Cell $wsSettings "E18:F18" "Segoe UI" 10 $true $false $cCharcoal $null "left" $true
    Format-Cell $wsSettings "G18" "Segoe UI" 10 $false $false $cCharcoal $null "right" $true "0.0%"
    Format-Cell $wsSettings "E18:F18" "Segoe UI" 10 $true $false $cCharcoal $null "left" $true
    Format-Cell $wsSettings "G18" "Segoe UI" 10 $false $false $cCharcoal $null "right" $true "0.0%"
    
    $wsSettings.Columns.Item(2).ColumnWidth = 25
    $wsSettings.Columns.Item(3).ColumnWidth = 15
    $wsSettings.Columns.Item(5).ColumnWidth = 28
    $wsSettings.Columns.Item(6).ColumnWidth = 12
    $wsSettings.Columns.Item(7).ColumnWidth = 18

    # ----------------------------------------------------
    # SHEET: RawDatabase (Transactional Database - Hidden)
    # ----------------------------------------------------
    Write-Output "Pre-populating database ledger..."
    $dbHeaders = @('Record ID', 'Date', 'Employee ID', 'Employee Name', 'Staff Type', 'Department', 'Base Rate', 'Overtime Type', 'Hours Worked', 'Multiplier', 'Overtime Pay', 'Approval Status', 'Approved By', 'Notes', 'Shift', 'Start Time', 'End Time')
    for ($c = 0; $c -lt $dbHeaders.Length; $c++) {
        $wsDatabase.Cells.Item(5, 2 + $c).Value2 = $dbHeaders[$c]
    }
    
    $mockRecords = @(
        @("OTR001", "2026-04-02", "EMP001", "Weekday", 4.0, "Approved", "Sarah Hanson", "Extended shift for kiln repair", "Night Shift", "18:00", "22:00"),
        @("OTR002", "2026-04-03", "EMP002", "Weekday", 3.0, "Approved", "Sarah Hanson", "Late billing reconciliation", "Day Shift", "17:00", "20:00"),
        @("OTR003", "2026-04-04", "CON001", "Weekend", 6.0, "Approved", "Kwame Mensah", "Silo clearing support", "Weekend Shift", "08:00", "14:00"),
        @("OTR004", "2026-04-05", "CON002", "Weekend", 8.0, "Approved", "Kwame Mensah", "Emergency raw material delivery", "Weekend Shift", "08:00", "16:00"),
        @("OTR005", "2026-04-07", "EMP004", "Emergency", 5.0, "Approved", "Albert Taylor", "Electrical fault in clinker cooler", "Night Shift", "20:00", "01:00"),
        @("OTR006", "2026-04-10", "EMP007", "Weekday", 2.5, "Approved", "Albert Taylor", "Safety inspection after hours", "Day Shift", "17:00", "19:30"),
        @("OTR007", "2026-04-11", "CON003", "Weekend", 6.0, "Approved", "Yaw Addo", "Bagging line packing help", "Weekend Shift", "12:00", "18:00"),
        @("OTR008", "2026-04-12", "CON004", "Weekend", 7.5, "Approved", "Ekow Gyan", "Scheduled conveyor belt maintenance", "Weekend Shift", "08:00", "15:30"),
        @("OTR009", "2026-04-14", "EMP003", "Weekday", 2.0, "Approved", "Charles Oppong", "Late truck dispatching checks", "Day Shift", "17:00", "19:00"),
        @("OTR010", "2026-04-15", "EMP008", "Weekday", 4.0, "Rejected", "Kofi Mensah", "Unapproved overtime extension", "Day Shift", "17:00", "21:00"),
        @("OTR011", "2026-04-18", "EMP009", "Weekend", 5.0, "Approved", "Charles Oppong", "Warehouse inventory count", "Weekend Shift", "08:00", "13:00"),
        @("OTR012", "2026-04-22", "CON005", "Holiday", 8.0, "Approved", "Yaa Baah", "Holiday safety standby coverage", "Day Shift", "08:00", "16:00"),

        @("OTR013", "2026-05-01", "EMP001", "Holiday", 6.0, "Approved", "Kofi Mensah", "May Day plant supervisor cover", "Day Shift", "08:00", "14:00"),
        @("OTR014", "2026-05-02", "CON001", "Weekday", 3.5, "Approved", "Kwame Mensah", "Bagging line overflow support", "Night Shift", "18:00", "21:30"),
        @("OTR015", "2026-05-03", "EMP002", "Weekend", 8.0, "Approved", "Kofi Mensah", "Sunday system backup and maintenance", "Weekend Shift", "08:00", "16:00"),
        @("OTR016", "2026-05-05", "EMP005", "Weekday", 2.0, "Approved", "Sarah Hanson", "Employee onboarding backlog", "Day Shift", "17:00", "19:00"),
        @("OTR017", "2026-05-08", "EMP010", "Emergency", 4.5, "Approved", "Albert Taylor", "Main grid power failure response", "Night Shift", "22:00", "02:30"),
        @("OTR018", "2026-05-12", "CON002", "Weekday", 3.0, "Approved", "Kwame Mensah", "Evening cement dispatch transport", "Night Shift", "18:00", "21:00"),
        @("OTR019", "2026-05-15", "EMP006", "Weekday", 4.0, "Approved", "Sarah Hanson", "Mid-month budget preparations", "Day Shift", "17:00", "21:00"),
        @("OTR020", "2026-05-18", "CON003", "Weekday", 4.0, "Approved", "Yaw Addo", "Additional truck loader duties", "Day Shift", "17:00", "21:00"),
        @("OTR021", "2026-05-20", "EMP004", "Weekday", 3.0, "Approved", "Albert Taylor", "Pre-shift equipment inspection", "Day Shift", "05:00", "08:00"),
        @("OTR022", "2026-05-24", "CON004", "Weekend", 8.0, "Approved", "Ekow Gyan", "Compressor overhaul assistance", "Weekend Shift", "08:00", "16:00"),
        @("OTR023", "2026-05-27", "EMP008", "Weekday", 5.0, "Pending", "Kofi Mensah", "Awaiting review - extra kiln support", "Night Shift", "18:00", "23:00"),
        @("OTR024", "2026-05-29", "EMP003", "Weekday", 3.0, "Approved", "Charles Oppong", "Late customer order processing", "Day Shift", "17:00", "20:00"),

        @("OTR025", "2026-06-01", "EMP001", "Weekday", 4.0, "Approved", "Kofi Mensah", "Supervising early morning startup", "Day Shift", "04:00", "08:00"),
        @("OTR026", "2026-06-02", "CON001", "Weekday", 3.0, "Approved", "Kwame Mensah", "Silo packing assistant", "Night Shift", "18:00", "21:00"),
        @("OTR027", "2026-06-03", "EMP002", "Weekday", 3.5, "Approved", "Kofi Mensah", "Control room handover delay", "Day Shift", "17:00", "20:30"),
        @("OTR028", "2026-06-04", "EMP004", "Weekday", 4.5, "Approved", "Albert Taylor", "Routine crusher lubrication", "Day Shift", "17:00", "21:30"),
        @("OTR029", "2026-06-05", "CON004", "Weekday", 9.0, "Approved", "Ekow Gyan", "Crusher repair - exceeded 8 hrs limit", "Night Shift", "17:00", "02:00"),
        @("OTR030", "2026-06-06", "EMP007", "Weekend", 6.0, "Approved", "Albert Taylor", "Weekend site safety verification", "Weekend Shift", "08:00", "14:00"),
        @("OTR031", "2026-06-07", "CON002", "Weekend", 8.0, "Approved", "Kwame Mensah", "Bulk loading logistics driver", "Weekend Shift", "08:00", "16:00"),
        @("OTR032", "2026-06-08", "EMP010", "Weekday", 2.0, "Approved", "Albert Taylor", "Control system update monitoring", "Day Shift", "17:00", "19:00"),
        @("OTR033", "2026-06-09", "EMP003", "Weekday", 3.0, "Approved", "Charles Oppong", "Logistics coordination meeting", "Day Shift", "17:00", "20:00"),
        @("OTR034", "2026-06-10", "CON003", "Weekday", 5.0, "Approved", "Yaw Addo", "Cement bag shipping duties", "Day Shift", "17:00", "22:00"),
        @("OTR035", "2026-06-11", "EMP009", "Weekday", 3.0, "Approved", "Charles Oppong", "Stock checks and auditing", "Day Shift", "17:00", "20:00"),
        @("OTR036", "2026-06-12", "CON005", "Emergency", 6.0, "Approved", "Yaa Baah", "Accident response & incident report", "Night Shift", "20:00", "02:00"),
        @("OTR037", "2026-06-13", "EMP008", "Weekend", 8.0, "Approved", "Kofi Mensah", "Saturday quarry operations cover", "Weekend Shift", "08:00", "16:00"),
        @("OTR038", "2026-06-14", "EMP001", "Weekend", 8.0, "Pending", "Kofi Mensah", "Kiln monitoring weekend shift", "Weekend Shift", "08:00", "16:00"),
        @("OTR039", "2026-06-15", "EMP006", "Weekday", 5.0, "Approved", "Sarah Hanson", "Tax filing and audits preparation", "Day Shift", "17:00", "22:00"),
        @("OTR040", "2026-06-15", "CON001", "Weekday", 4.0, "Pending", "Kwame Mensah", "Late cleaning after shift close", "Night Shift", "18:00", "22:00")
    )
    
    $r = 6
    foreach ($rec in $mockRecords) {
        $wsDatabase.Cells.Item($r, 2).Value = $rec[0] # RecID
        $wsDatabase.Cells.Item($r, 3).Value = $rec[1] # Date
        $wsDatabase.Cells.Item($r, 4).Value = $rec[2] # EmpID
        
        # Formulas
        $wsDatabase.Cells.Item($r, 5).Formula = "=XLOOKUP(D$r, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$C`$6:`$C`$20, ""Unknown"")"
        $wsDatabase.Cells.Item($r, 6).Formula = "=XLOOKUP(D$r, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$D`$6:`$D`$20, ""Unknown"")"
        $wsDatabase.Cells.Item($r, 7).Formula = "=XLOOKUP(D$r, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$E`$6:`$E`$20, ""Unknown"")"
        $wsDatabase.Cells.Item($r, 8).Formula = "=XLOOKUP(D$r, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$G`$6:`$G`$20, 0)"
        
        $wsDatabase.Cells.Item($r, 9).Value = $rec[3] # OT Type
        
        # Q and R (Times)
        $wsDatabase.Cells.Item($r, 17).Value = $rec[9] # StartTime
        $wsDatabase.Cells.Item($r, 18).Value = $rec[10] # EndTime
        
        # Multiplier formula
        $wsDatabase.Cells.Item($r, 11).Formula = "=XLOOKUP(I$r, 'Help & Settings'!`$B`$16:`$B`$19, 'Help & Settings'!`$C`$16:`$C`$19, 1.0)"
        # Pay formula
        $wsDatabase.Cells.Item($r, 12).Formula = "=J$r * K$r * H$r"
        
        # Write static hours instead of formula for mock data
        $wsDatabase.Cells.Item($r, 10).Value = $rec[4].ToString()
        
        $wsDatabase.Cells.Item($r, 13).Value = $rec[5] # Status
        $wsDatabase.Cells.Item($r, 14).Value = $rec[6] # ApprovedBy
        $wsDatabase.Cells.Item($r, 15).Value = $rec[7] # Notes
        $wsDatabase.Cells.Item($r, 16).Value = $rec[8] # Shift
        
        $r++
    }

    # ----------------------------------------------------
    # SHEET: Home (Clean Landing Dashboard)
    # ----------------------------------------------------
    Write-Output "Configuring Home Landing Page..."
    $wsHome# Removed gridline call
    Create-Banner $wsHome "Employee Overtime Portal" 8 $cNavy
    
    $wsHome.Cells.Item(5, 2).Value2 = "GHACEM OVERTIME PORTAL"
    Format-Cell $wsHome "B5" "Segoe UI" 14 $true $false $cNavy
    
    $wsHome.Cells.Item(6, 2).Value2 = "Select an option below to navigate the portal:"
    Format-Cell $wsHome "B6" "Segoe UI" 10 $false $true $cCharcoal
    
    # Create Home navigation buttons (rounded shapes)
    $buttons = @(
        # Text, Top, Left, Width, Height, Macro
        @("New Overtime Request", 140, 40, 200, 45, "NavigateToRequest"),
        @("Supervisor Approval Center", 200, 40, 200, 45, "NavigateToApproval"),
        @("Payroll Dashboard", 140, 280, 200, 45, "NavigateToPayroll"),
        @("Management Dashboard", 200, 280, 200, 45, "NavigateToManagement"),
        @("Help & Settings", 260, 40, 200, 45, "NavigateToHelp")
    )
    
    foreach ($btn in $buttons) {
        $shape = $wsHome.Shapes.AddShape(5, $btn[2], $btn[1], $btn[3], $btn[4]) # 5 = msoShapeRoundedRectangle
        $shape.TextFrame.Characters().Text = $btn[0]
        $shape.OnAction = $btn[5]
        $shape.Fill.Solid()
        $shape.Fill.ForeColor.RGB = $cNavy
        $shape.Line.ForeColor.RGB = $cOrange
        $shape.Line.Weight = 1.5
        $shape.TextFrame.Characters().Font.Name = "Segoe UI"
        $shape.TextFrame.Characters().Font.Size = 10
        $shape.TextFrame.Characters().Font.Bold = $true
        $shape.TextFrame.Characters().Font.Color = $cWhite
        $shape.TextFrame.HorizontalAlignment = -4108 # xlCenter
        $shape.TextFrame.VerticalAlignment = -4108 # xlCenter
    }

    # ----------------------------------------------------
    # SHEET: Request Form (Blue Theme)
    # ----------------------------------------------------
    Write-Output "Designing Overtime Request Form..."
    $wsRequest# Removed gridline call
    Create-Banner $wsRequest "Employee Overtime Request Form" 4 $cNavy
    
    $wsRequest.Cells.Item(5, 2).Value2 = "1. Employee Information"
    Format-Cell $wsRequest "B5" "Segoe UI" 12 $true $false $cNavy
    
    $reqFields1 = @('Employee ID', 'Employee Name', 'Department', 'Category', 'Supervisor')
    for ($i = 0; $i -lt $reqFields1.Length; $i++) {
        $row = 6 + $i
        $wsRequest.Cells.Item($row, 2).Value2 = $reqFields1[$i]
        Format-Cell $wsRequest "B$row" "Segoe UI" 10 $true $false $cCharcoal $cIceBlue "left" $true
        Format-Cell $wsRequest "C$row" "Segoe UI" 10 $false $false $cCharcoal $null "left" $true
    }
    
    # Formulas for autofills
    $wsRequest.Cells.Item(7, 3).Formula = "=XLOOKUP(C6, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$C`$6:`$C`$20, """")"
    $wsRequest.Cells.Item(8, 3).Formula = "=XLOOKUP(C6, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$E`$6:`$E`$20, """")"
    $wsRequest.Cells.Item(9, 3).Formula = "=XLOOKUP(C6, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$D`$6:`$D`$20, """")"
    $wsRequest.Cells.Item(10, 3).Formula = "=XLOOKUP(C6, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$H`$6:`$H`$20, """")"
    
    $wsRequest.Cells.Item(12, 2).Value2 = "2. Overtime Details"
    Format-Cell $wsRequest "B12" "Segoe UI" 12 $true $false $cNavy
    
    $reqFields2 = @('Date (DD/MM/YYYY)', 'Shift', 'Overtime Type', 'Start Time (HH:MM)', 'End Time (HH:MM)', 'Total Hours', 'Reason')
    for ($i = 0; $i -lt $reqFields2.Length; $i++) {
        $row = 13 + $i
        $wsRequest.Cells.Item($row, 2).Value2 = $reqFields2[$i]
        Format-Cell $wsRequest "B$row" "Segoe UI" 10 $true $false $cCharcoal $cIceBlue "left" $true
        Format-Cell $wsRequest "C$row" "Segoe UI" 10 $false $false $cCharcoal $null "left" $true
    }
    
    # Total Hours formula
    $wsRequest.Cells.Item(18, 3).Formula = "=IF(AND(C16<>"""", C17<>""""), ROUND((C17-C16)*24, 2), 0)"
    Format-Cell $wsRequest "C18" "Segoe UI" 10 $true $false $cNavy $null "right" $true
    
    # Validation Dropdowns on request form
    $valC6 = $wsRequest.Range("C6").Validation
    $valC6.Delete()
    $valC6.Add(3, 1, 1, "=EmployeeMaster!`$B`$6:`$B`$20")
    $valC6.InCellDropdown = $true
    
    $valC14 = $wsRequest.Range("C14").Validation
    $valC14.Delete()
    $valC14.Add(3, 1, 1, "Day Shift,Night Shift,Weekend Shift")
    $valC14.InCellDropdown = $true
    
    $valC15 = $wsRequest.Range("C15").Validation
    $valC15.Delete()
    $valC15.Add(3, 1, 1, "Weekday,Weekend,Holiday,Emergency")
    $valC15.InCellDropdown = $true

    # Number format for dates & times
    Format-Cell $wsRequest "C13" "Segoe UI" 10 $false $false $cCharcoal $null "left" $true "YYYY-MM-DD"
    Format-Cell $wsRequest "C16" "Segoe UI" 10 $false $false $cCharcoal $null "left" $true "HH:MM"
    Format-Cell $wsRequest "C17" "Segoe UI" 10 $false $false $cCharcoal $null "left" $true "HH:MM"

    # Draw request form buttons
    # Submit Request Button
    $btnSubmit = $wsRequest.Shapes.AddShape(5, 40, 420, 310, 40)
    $btnSubmit.TextFrame.Characters().Text = "SUBMIT OVERTIME REQUEST"
    $btnSubmit.OnAction = "SubmitRequest"
    $btnSubmit.Fill.Solid()
    $btnSubmit.Fill.ForeColor.RGB = $cNavy
    $btnSubmit.Line.ForeColor.RGB = $cOrange
    $btnSubmit.TextFrame.Characters().Font.Color = $cWhite
    $btnSubmit.TextFrame.Characters().Font.Bold = $true
    $btnSubmit.TextFrame.HorizontalAlignment = -4108
    $btnSubmit.TextFrame.VerticalAlignment = -4108

    # Home Navigation Button on form
    $btnHome1 = $wsRequest.Shapes.AddShape(5, 40, 470, 310, 30)
    $btnHome1.TextFrame.Characters().Text = "Return to Portal Home"
    $btnHome1.OnAction = "NavigateToHome"
    $btnHome1.Fill.Solid()
    $btnHome1.Fill.ForeColor.RGB = $cLightGrey
    $btnHome1.Line.ForeColor.RGB = $cNavy
    $btnHome1.TextFrame.Characters().Font.Color = $cNavy
    $btnHome1.TextFrame.Characters().Font.Bold = $true
    $btnHome1.TextFrame.HorizontalAlignment = -4108
    $btnHome1.TextFrame.VerticalAlignment = -4108

    $wsRequest.Columns.Item(2).ColumnWidth = 24
    $wsRequest.Columns.Item(3).ColumnWidth = 35

    # ----------------------------------------------------
    # SHEET: Approval Center (Orange Theme)
    # ----------------------------------------------------
    Write-Output "Designing Approval Center..."
    $wsApproval# Removed gridline call
    Create-Banner $wsApproval "Supervisor Approval Center" 4 $cOrange
    
    $wsApproval.Cells.Item(5, 2).Value2 = "Action Pending Requests"
    Format-Cell $wsApproval "B5" "Segoe UI" 12 $true $false $cOrange
    
    $wsApproval.Cells.Item(7, 2).Value2 = "Select Request ID"
    Format-Cell $wsApproval "B7" "Segoe UI" 10 $true $false $cCharcoal $cSoftYellow "left" $true
    Format-Cell $wsApproval "C7" "Segoe UI" 10 $true $false $cCharcoal $null "left" $true
    
    $appFields = @('Employee ID', 'Employee Name', 'Supervisor (Reviewer)', 'Date of Overtime', 'Overtime Type', 'Hours Worked', 'Reason')
    for ($i = 0; $i -lt $appFields.Length; $i++) {
        $row = 9 + $i
        $wsApproval.Cells.Item($row, 2).Value2 = $appFields[$i]
        Format-Cell $wsApproval "B$row" "Segoe UI" 10 $true $false $cCharcoal $cSoftYellow "left" $true
        Format-Cell $wsApproval "C$row" "Segoe UI" 10 $false $false $cCharcoal $null "left" $true
    }
    
    # Formulas for values lookup
    $wsApproval.Cells.Item(9, 3).Formula = "=XLOOKUP(C7, RawDatabase!`$B`$6:`$B`$500, RawDatabase!`$D`$6:`$D`$500, """")"
    $wsApproval.Cells.Item(10, 3).Formula = "=XLOOKUP(C7, RawDatabase!`$B`$6:`$B`$500, RawDatabase!`$E`$6:`$E`$500, """")"
    $wsApproval.Cells.Item(11, 3).Formula = "=XLOOKUP(C9, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$H`$6:`$H`$20, """")"
    $wsApproval.Cells.Item(12, 3).Formula = "=XLOOKUP(C7, RawDatabase!`$B`$6:`$B`$500, RawDatabase!`$C`$6:`$C`$500, """")"
    $wsApproval.Cells.Item(12, 3).NumberFormat = "YYYY-MM-DD"
    $wsApproval.Cells.Item(13, 3).Formula = "=XLOOKUP(C7, RawDatabase!`$B`$6:`$B`$500, RawDatabase!`$I`$6:`$I`$500, """")"
    $wsApproval.Cells.Item(14, 3).Formula = "=XLOOKUP(C7, RawDatabase!`$B`$6:`$B`$500, RawDatabase!`$J`$6:`$J`$500, 0)"
    Format-Cell $wsApproval "C14" "Segoe UI" 10 $true $false $cCharcoal $null "right" $true "0.0"
    $wsApproval.Cells.Item(15, 3).Formula = "=XLOOKUP(C7, RawDatabase!`$B`$6:`$B`$500, RawDatabase!`$O`$6:`$O`$500, """")"

    # Action Buttons on approval page
    # Approve Button
    $btnApprove = $wsApproval.Shapes.AddShape(5, 40, 340, 150, 40)
    $btnApprove.TextFrame.Characters().Text = "APPROVE REQUEST"
    $btnApprove.OnAction = "ApproveRequest"
    $btnApprove.Fill.Solid()
    $btnApprove.Fill.ForeColor.RGB = $cGreen
    $btnApprove.Line.ForeColor.RGB = $cWhite
    $btnApprove.TextFrame.Characters().Font.Color = $cWhite
    $btnApprove.TextFrame.Characters().Font.Bold = $true
    $btnApprove.TextFrame.HorizontalAlignment = -4108
    $btnApprove.TextFrame.VerticalAlignment = -4108

    # Reject Button
    $btnReject = $wsApproval.Shapes.AddShape(5, 200, 340, 150, 40)
    $btnReject.TextFrame.Characters().Text = "REJECT REQUEST"
    $btnReject.OnAction = "RejectRequest"
    $btnReject.Fill.Solid()
    $btnReject.Fill.ForeColor.RGB = $cOrange
    $btnReject.Line.ForeColor.RGB = $cWhite
    $btnReject.TextFrame.Characters().Font.Color = $cWhite
    $btnReject.TextFrame.Characters().Font.Bold = $true
    $btnReject.TextFrame.HorizontalAlignment = -4108
    $btnReject.TextFrame.VerticalAlignment = -4108

    # Home Navigation Button on approval
    $btnHome2 = $wsApproval.Shapes.AddShape(5, 40, 390, 310, 30)
    $btnHome2.TextFrame.Characters().Text = "Return to Portal Home"
    $btnHome2.OnAction = "NavigateToHome"
    $btnHome2.Fill.Solid()
    $btnHome2.Fill.ForeColor.RGB = $cLightGrey
    $btnHome2.Line.ForeColor.RGB = $cNavy
    $btnHome2.TextFrame.Characters().Font.Color = $cNavy
    $btnHome2.TextFrame.Characters().Font.Bold = $true
    $btnHome2.TextFrame.HorizontalAlignment = -4108
    $btnHome2.TextFrame.VerticalAlignment = -4108

    $wsApproval.Columns.Item(2).ColumnWidth = 24
    $wsApproval.Columns.Item(3).ColumnWidth = 35

    # ----------------------------------------------------
    # SHEET: Payroll Dashboard (Purple Theme)
    # ----------------------------------------------------
    Write-Output "Designing Payroll Dashboard..."
    $wsPayroll# Removed gridline call
    Create-Banner $wsPayroll "Payroll Overtime Summary (June 2026)" 10 $cPurple
    
    $payHeaders = @(
        'Employee ID', 'Full Name', 'Staff Type', 'Department', 'Hourly Rate',
        'Approved OT Hours', 'Total OT Pay (Gross GHS)', 'Tax Rate', 'Tax Deduction (GHS)', 'Net OT Pay (GHS)'
    )
    Write-Output "Writing payroll headers..."
    for ($c = 0; $c -lt $payHeaders.Length; $c++) {
        $wsPayroll.Cells.Item(5, 2 + $c).Value2 = $payHeaders[$c]
        $colLetter = [char](66 + $c)
        Format-Cell $wsPayroll "$($colLetter)5" "Segoe UI" 10 $true $false $cWhite $cPurple "center" $true
    }
    $wsPayroll.Rows.Item(5).RowHeight = 28
    
    # 15 Employee rows in Payroll Summary
    Write-Output "Entering payroll loop..."
    for ($i = 0; $i -lt 15; $i++) {
        $row = 6 + $i
        Write-Output "  Processing row $row..."
        $wsPayroll.Cells.Item($row, 2).Formula = "=EmployeeMaster!B$(6+$i)"
        Format-Cell $wsPayroll "B$row" "Segoe UI" 10 $true $false $cCharcoal $null "center" $true
        
        $wsPayroll.Cells.Item($row, 3).Formula = "=XLOOKUP(B$row, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$C`$6:`$C`$20, """")"
        Format-Cell $wsPayroll "C$row" "Segoe UI" 10 $false $false $cCharcoal $null "left" $true
        
        $wsPayroll.Cells.Item($row, 4).Formula = "=XLOOKUP(B$row, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$D`$6:`$D`$20, """")"
        Format-Cell $wsPayroll "D$row" "Segoe UI" 10 $false $false $cCharcoal $null "center" $true
        
        $wsPayroll.Cells.Item($row, 5).Formula = "=XLOOKUP(B$row, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$E`$6:`$E`$20, """")"
        Format-Cell $wsPayroll "E$row" "Segoe UI" 10 $false $false $cCharcoal $null "center" $true
        
        $wsPayroll.Cells.Item($row, 6).Formula = "=XLOOKUP(B$row, EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$G`$6:`$G`$20, 0)"
        Format-Cell $wsPayroll "F$row" "Segoe UI" 10 $false $false $cCharcoal $null "right" $true '"GHS" #,##0.00'
        
        # Approved OT Hours (SUMIFS for June 2026)
        $wsPayroll.Cells.Item($row, 7).Formula = "=SUMIFS(RawDatabase!`$J`$6:`$J`$500, RawDatabase!`$D`$6:`$D`$500, B$row, RawDatabase!`$M`$6:`$M`$500, ""Approved"", RawDatabase!`$C`$6:`$C`$500, "">=2026-06-01"", RawDatabase!`$C`$6:`$C`$500, ""<=2026-06-30"")"
        Format-Cell $wsPayroll "G$row" "Segoe UI" 10 $false $false $cCharcoal $null "right" $true '0.0'
        
        # Gross OT Pay (SUMIFS for June 2026)
        $wsPayroll.Cells.Item($row, 8).Formula = "=SUMIFS(RawDatabase!`$L`$6:`$L`$500, RawDatabase!`$D`$6:`$D`$500, B$row, RawDatabase!`$M`$6:`$M`$500, ""Approved"", RawDatabase!`$C`$6:`$C`$500, "">=2026-06-01"", RawDatabase!`$C`$6:`$C`$500, ""<=2026-06-30"")"
        Format-Cell $wsPayroll "H$row" "Segoe UI" 10 $true $false $cCharcoal $null "right" $true '"GHS" #,##0.00'
        
        # Tax Rate
        $wsPayroll.Cells.Item($row, 9).Formula = "=IF(D$row=""Contract"", 'Help & Settings'!`$G`$17, 'Help & Settings'!`$G`$18)"
        Format-Cell $wsPayroll "I$row" "Segoe UI" 10 $false $false $cCharcoal $null "right" $true '0.0%'
        
        # Tax Deduction
        $wsPayroll.Cells.Item($row, 10).Formula = "=H$row * I$row"
        Format-Cell $wsPayroll "J$row" "Segoe UI" 10 $false $false $cCharcoal $null "right" $true '"GHS" #,##0.00'
        
        # Net OT Pay
        $wsPayroll.Cells.Item($row, 11).Formula = "=H$row - J$row"
        Format-Cell $wsPayroll "K$row" "Segoe UI" 10 $true $false $cCharcoal $null "right" $true '"GHS" #,##0.00'
        
        # Zebra striping
        if ($i % 2 -eq 1) {
            $wsPayroll.Range("B$row:K$row").Interior.Color = $cIceBlue
        }
    }
    
    # Totals Row
    $tRow = 21
    $wsPayroll.Cells.Item($tRow, 2).Value2 = "Total Approved"
    $wsPayroll.Range("B21:F21").Merge()
    Format-Cell $wsPayroll "B$tRow" "Segoe UI" 10 $true $false $cCharcoal $cLightGrey "right"
    for ($c = 2; $c -le 6; $c++) {
        $wsPayroll.Cells.Item($tRow, $c).Borders.Item(8).LineStyle = 1 # Top border
        $wsPayroll.Cells.Item($tRow, $c).Borders.Item(9).LineStyle = 9 # Double bottom border (xlDouble = 9)
    }
    
    $colsToSum = @('G', 'H', 'J', 'K')
    foreach ($col in $colsToSum) {
        $wsPayroll.Cells.Item($tRow, $col).Formula = "=SUM($($col)6:$($col)20)"
        Format-Cell $wsPayroll "$col$tRow" "Segoe UI" 10 $true $false $cCharcoal $cLightGrey "right"
        $wsPayroll.Cells.Item($tRow, $col).Borders.Item(8).LineStyle = 1
        $wsPayroll.Cells.Item($tRow, $col).Borders.Item(9).LineStyle = 9
        
        if ($col -eq 'G') {
            $wsPayroll.Cells.Item($tRow, $col).NumberFormat = "0.0"
        } else {
            $wsPayroll.Cells.Item($tRow, $col).NumberFormat = '"GHS" #,##0.00'
        }
    }
    # Formatting for empty space in total row
    $wsPayroll.Cells.Item($tRow, 'I').Interior.Color = $cLightGrey
    $wsPayroll.Cells.Item($tRow, 'I').Borders.Item(8).LineStyle = 1
    $wsPayroll.Cells.Item($tRow, 'I').Borders.Item(9).LineStyle = 9
    
    # Action Buttons on Payroll Dashboard
    $btnExport = $wsPayroll.Shapes.AddShape(5, 40, 460, 200, 35)
    $btnExport.TextFrame.Characters().Text = "Export Payroll Report"
    $btnExport.OnAction = "NavigateToHome" # Navigate back for now, or assign dummy
    $btnExport.Fill.Solid()
    $btnExport.Fill.ForeColor.RGB = $cPurple
    $btnExport.Line.ForeColor.RGB = $cWhite
    $btnExport.TextFrame.Characters().Font.Color = $cWhite
    $btnExport.TextFrame.Characters().Font.Bold = $true
    $btnExport.TextFrame.HorizontalAlignment = -4108
    $btnExport.TextFrame.VerticalAlignment = -4108

    $btnPrint = $wsPayroll.Shapes.AddShape(5, 260, 460, 200, 35)
    $btnPrint.TextFrame.Characters().Text = "Print Summary Report"
    $btnPrint.OnAction = "NavigateToHome"
    $btnPrint.Fill.Solid()
    $btnPrint.Fill.ForeColor.RGB = $cPurple
    $btnPrint.Line.ForeColor.RGB = $cWhite
    $btnPrint.TextFrame.Characters().Font.Color = $cWhite
    $btnPrint.TextFrame.Characters().Font.Bold = $true
    $btnPrint.TextFrame.HorizontalAlignment = -4108
    $btnPrint.TextFrame.VerticalAlignment = -4108

    # Home button
    $btnHome3 = $wsPayroll.Shapes.AddShape(5, 480, 460, 200, 35)
    $btnHome3.TextFrame.Characters().Text = "Return to Portal Home"
    $btnHome3.OnAction = "NavigateToHome"
    $btnHome3.Fill.Solid()
    $btnHome3.Fill.ForeColor.RGB = $cLightGrey
    $btnHome3.Line.ForeColor.RGB = $cNavy
    $btnHome3.TextFrame.Characters().Font.Color = $cNavy
    $btnHome3.TextFrame.Characters().Font.Bold = $true
    $btnHome3.TextFrame.HorizontalAlignment = -4108
    $btnHome3.TextFrame.VerticalAlignment = -4108

    $wsPayroll.Columns.Item(2).ColumnWidth = 14 # ID
    $wsPayroll.Columns.Item(3).ColumnWidth = 22 # Name
    $wsPayroll.Columns.Item(4).ColumnWidth = 14 # Type
    $wsPayroll.Columns.Item(5).ColumnWidth = 16 # Dept
    $wsPayroll.Columns.Item(6).ColumnWidth = 16 # Rate
    $wsPayroll.Columns.Item(7).ColumnWidth = 18 # Hours
    $wsPayroll.Columns.Item(8).ColumnWidth = 22 # Gross
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
        $wsCalculations.Cells.Item($r, 2).Formula = "=SUMIFS(RawDatabase!`$L`$6:`$L`$500, RawDatabase!`$G`$6:`$G`$500, A$r, RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
        $r++
    }
    
    # Table 2: Monthly Trends
    $wsCalculations.Cells.Item(14, 1).Value2 = "Month"
    $wsCalculations.Cells.Item(14, 2).Value2 = "Hours"
    $wsCalculations.Cells.Item(14, 3).Value2 = "Cost"
    
    $wsCalculations.Cells.Item(15, 1).Value2 = "April 2026"
    $wsCalculations.Cells.Item(15, 2).Formula = "=SUMIFS(RawDatabase!`$J`$6:`$J`$500, RawDatabase!`$C`$6:`$C`$500, "">=2026-04-01"", RawDatabase!`$C`$6:`$C`$500, ""<=2026-04-30"", RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
    $wsCalculations.Cells.Item(15, 3).Formula = "=SUMIFS(RawDatabase!`$L`$6:`$L`$500, RawDatabase!`$C`$6:`$C`$500, "">=2026-04-01"", RawDatabase!`$C`$6:`$C`$500, ""<=2026-04-30"", RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
    
    $wsCalculations.Cells.Item(16, 1).Value2 = "May 2026"
    $wsCalculations.Cells.Item(16, 2).Formula = "=SUMIFS(RawDatabase!`$J`$6:`$J`$500, RawDatabase!`$C`$6:`$C`$500, "">=2026-05-01"", RawDatabase!`$C`$6:`$C`$500, ""<=2026-05-31"", RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
    $wsCalculations.Cells.Item(16, 3).Formula = "=SUMIFS(RawDatabase!`$L`$6:`$L`$500, RawDatabase!`$C`$6:`$C`$500, "">=2026-05-01"", RawDatabase!`$C`$6:`$C`$500, ""<=2026-05-31"", RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
    
    $wsCalculations.Cells.Item(17, 1).Value2 = "June 2026"
    $wsCalculations.Cells.Item(17, 2).Formula = "=SUMIFS(RawDatabase!`$J`$6:`$J`$500, RawDatabase!`$C`$6:`$C`$500, "">=2026-06-01"", RawDatabase!`$C`$6:`$C`$500, ""<=2026-06-30"", RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
    $wsCalculations.Cells.Item(17, 3).Formula = "=SUMIFS(RawDatabase!`$L`$6:`$L`$500, RawDatabase!`$C`$6:`$C`$500, "">=2026-06-01"", RawDatabase!`$C`$6:`$C`$500, ""<=2026-06-30"", RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
    
    # Table 3: Staff vs Contract
    $wsCalculations.Cells.Item(21, 1).Value2 = "Staff Type"
    $wsCalculations.Cells.Item(21, 2).Value2 = "Hours"
    $wsCalculations.Cells.Item(21, 3).Value2 = "Cost"
    
    $wsCalculations.Cells.Item(22, 1).Value2 = "Permanent"
    $wsCalculations.Cells.Item(22, 2).Formula = "=SUMIFS(RawDatabase!`$J`$6:`$J`$500, RawDatabase!`$F`$6:`$F`$500, A22, RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
    $wsCalculations.Cells.Item(22, 3).Formula = "=SUMIFS(RawDatabase!`$L`$6:`$L`$500, RawDatabase!`$F`$6:`$F`$500, A22, RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
    
    $wsCalculations.Cells.Item(23, 1).Value2 = "Contract"
    $wsCalculations.Cells.Item(23, 2).Formula = "=SUMIFS(RawDatabase!`$J`$6:`$J`$500, RawDatabase!`$F`$6:`$F`$500, A23, RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
    $wsCalculations.Cells.Item(23, 3).Formula = "=SUMIFS(RawDatabase!`$L`$6:`$L`$500, RawDatabase!`$F`$6:`$F`$500, A23, RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
    
    # Table 4: Top Employee Earners
    $wsCalculations.Cells.Item(26, 1).Value2 = "Employee Name"
    $wsCalculations.Cells.Item(26, 2).Value2 = "Approved Cost"
    for ($i = 0; $i -lt 15; $i++) {
        $row = 27 + $i
        $wsCalculations.Cells.Item($row, 1).Formula = "=EmployeeMaster!C$(6+$i)" # Full Name
        $wsCalculations.Cells.Item($row, 2).Formula = "=SUMIFS(RawDatabase!`$L`$6:`$L`$500, RawDatabase!`$E`$6:`$E`$500, A$row, RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
    }

    # ----------------------------------------------------
    # SHEET: Management Dashboard (Navy & Gold Theme)
    # ----------------------------------------------------
    Write-Output "Designing Management Dashboard & charts..."
    $wsManagement# Removed gridline call
    Create-Banner $wsManagement "Executive Management Dashboard" 12 $cNavy
    
    # KPI Cards Row 5-6
    # Card 1: Total OT Hours (Approved) (B5:C6)
    $wsManagement.Range("B5:C5").Merge()
    $wsManagement.Cells.Item(5, 2).Value2 = "TOTAL OT HOURS"
    Format-Cell $wsManagement "B5" "Segoe UI" 9 $true $false $cCharcoal $cLightGrey "center"
    
    $wsManagement.Range("B6:C6").Merge()
    $wsManagement.Cells.Item(6, 2).Formula = "=SUMIFS(RawDatabase!`$J`$6:`$J`$500, RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
    Format-Cell $wsManagement "B6" "Segoe UI" 14 $true $false $cNavy $cLightGrey "center" $false "#,##0.0"
    
    # Card 2: Total OT Cost (Approved) (D5:E6)
    $wsManagement.Range("D5:E5").Merge()
    $wsManagement.Cells.Item(5, 4).Value2 = "TOTAL OT COST"
    Format-Cell $wsManagement "D5" "Segoe UI" 9 $true $false $cCharcoal $cLightGrey "center"
    
    $wsManagement.Range("D6:E6").Merge()
    $wsManagement.Cells.Item(6, 4).Formula = "=SUMIFS(RawDatabase!`$L`$6:`$L`$500, RawDatabase!`$M`$6:`$M`$500, ""Approved"")"
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
    $wsManagement.Cells.Item(6, 10).Formula = "=COUNTIFS(RawDatabase!`$M`$6:`$M`$500, ""Pending"")"
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

    # Add Return to Home Button on Management Dashboard
    $btnHome4 = $wsManagement.Shapes.AddShape(5, 40, 680, 200, 30)
    $btnHome4.TextFrame.Characters().Text = "Return to Portal Home"
    $btnHome4.OnAction = "NavigateToHome"
    $btnHome4.Fill.Solid()
    $btnHome4.Fill.ForeColor.RGB = $cLightGrey
    $btnHome4.Line.ForeColor.RGB = $cNavy
    $btnHome4.TextFrame.Characters().Font.Color = $cNavy
    $btnHome4.TextFrame.Characters().Font.Bold = $true
    $btnHome4.TextFrame.HorizontalAlignment = -4108
    $btnHome4.TextFrame.VerticalAlignment = -4108

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

    # ----------------------------------------------------
    # VBA MODULE CODE INSERTION
    # ----------------------------------------------------
    Write-Output "Writing VBA module backend..."
    $vbaProj = $wb.VBProject
    $vbaMod = $vbaProj.VBComponents.Add(1) # vbext_ct_StdModule = 1
    $vbaMod.Name = "PortalBackend"
    
    $vbaCode = @"
Sub NavigateToHome()
    Sheets("Home").Select
    Range("A1").Select
End Sub

Sub NavigateToRequest()
    Sheets("Request Form").Select
    Range("C6").Select ' Focus on Employee ID
End Sub

Sub NavigateToApproval()
    Call RefreshApprovalDropdown
    Sheets("Approval Center").Select
    Range("C7").Select
End Sub

Sub NavigateToPayroll()
    Sheets("Payroll Dashboard").Select
    Range("A1").Select
End Sub

Sub NavigateToManagement()
    Sheets("Management Dashboard").Select
    Range("A1").Select
End Sub

Sub NavigateToHelp()
    Sheets("Help & Settings").Select
    Range("A1").Select
End Sub

Sub SubmitRequest()
    Dim wsForm As Worksheet
    Dim wsDB As Worksheet
    Dim nextRow As Long
    Dim empID As String
    Dim otDate As Variant
    Dim shift As String
    Dim otType As String
    Dim startTime As String
    Dim endTime As String
    Dim reason As String
    Dim reqID As String
    Dim lastReqNum As Long
    
    Set wsForm = Sheets("Request Form")
    Set wsDB = Sheets("RawDatabase")
    
    ' Extract values
    empID = wsForm.Range("C6").Value
    otDate = wsForm.Range("C13").Value
    shift = wsForm.Range("C14").Value
    otType = wsForm.Range("C15").Value
    startTime = wsForm.Range("C16").Text
    endTime = wsForm.Range("C17").Text
    reason = wsForm.Range("C19").Value
    
    ' Validate inputs
    If empID = "" Or otDate = "" Or shift = "" Or otType = "" Or startTime = "" Or endTime = "" Or reason = "" Then
        MsgBox "Please fill in all the required form fields before submitting.", vbCritical + vbOKOnly, "Validation Failure"
        Exit Sub
    End If
    
    ' Generate Request ID (e.g. OT-2026-00041)
    nextRow = wsDB.Cells(wsDB.Rows.Count, "B").End(-4162).Row + 1 ' xlUp = -4162
    If nextRow <= 5 Then
        nextRow = 6
        reqID = "OT-2026-00001"
    Else
        Dim lastID As String
        lastID = wsDB.Cells(nextRow - 1, 2).Value
        If Left(lastID, 8) = "OT-2026-" Then
            lastReqNum = Val(Right(lastID, 5)) + 1
            reqID = "OT-2026-" & Format(lastReqNum, "00000")
        Else
            reqID = "OT-2026-00001"
        End If
    End If
    
    ' Write to RawDatabase row
    wsDB.Cells(nextRow, 2).Value = reqID
    wsDB.Cells(nextRow, 3).Value = otDate
    wsDB.Cells(nextRow, 4).Value = empID
    
    ' XLOOKUP lookup formulas
    wsDB.Cells(nextRow, 5).Formula = "=XLOOKUP(D" & nextRow & ", EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$C`$6:`$C`$20, ""Unknown"")"
    wsDB.Cells(nextRow, 6).Formula = "=XLOOKUP(D" & nextRow & ", EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$D`$6:`$D`$20, ""Unknown"")"
    wsDB.Cells(nextRow, 7).Formula = "=XLOOKUP(D" & nextRow & ", EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$E`$6:`$E`$20, ""Unknown"")"
    wsDB.Cells(nextRow, 8).Formula = "=XLOOKUP(D" & nextRow & ", EmployeeMaster!`$B`$6:`$B`$20, EmployeeMaster!`$G`$6:`$G`$20, 0)"
    
    wsDB.Cells(nextRow, 9).Value = otType
    wsDB.Cells(nextRow, 17).Value = startTime
    wsDB.Cells(nextRow, 18).Value = endTime
    
    ' Hours formula
    wsDB.Cells(nextRow, 10).Formula = "=ROUND((R" & nextRow & " - Q" & nextRow & ")*24, 2)"
    ' Multiplier formula
    wsDB.Cells(nextRow, 11).Formula = "=XLOOKUP(I" & nextRow & ", 'Help & Settings'!`$B`$16:`$B`$19, 'Help & Settings'!`$C`$16:`$C`$19, 1.0)"
    ' Pay formula
    wsDB.Cells(nextRow, 12).Formula = "=J" & nextRow & "*K" & nextRow & "*H" & nextRow
    
    wsDB.Cells(nextRow, 13).Value = "Pending"
    wsDB.Cells(nextRow, 14).Value = ""
    wsDB.Cells(nextRow, 15).Value = reason
    wsDB.Cells(nextRow, 16).Value = shift
    
    ' Clear the Form fields
    wsForm.Range("C6").Value = ""
    wsForm.Range("C13").Value = ""
    wsForm.Range("C14").Value = ""
    wsForm.Range("C15").Value = ""
    wsForm.Range("C16").Value = ""
    wsForm.Range("C17").Value = ""
    wsForm.Range("C19").Value = ""
    
    MsgBox "Request Submitted Successfully!" & vbCrLf & "Reference ID: " & reqID, vbInformation + vbOKOnly, "Submission Confirmed"
    
    Application.Calculate
    Call RefreshApprovalDropdown
End Sub

Sub RefreshApprovalDropdown()
    Dim wsDB As Worksheet
    Dim wsApp As Worksheet
    Dim r As Long
    Dim listStr As String
    
    Set wsDB = Sheets("RawDatabase")
    Set wsApp = Sheets("Approval Center")
    
    listStr = ""
    For r = 6 To wsDB.Cells(wsDB.Rows.Count, "B").End(-4162).Row
        If wsDB.Cells(r, 13).Value = "Pending" Then
            listStr = listStr & wsDB.Cells(r, 2).Value & ","
        End If
    Next r
    
    If listStr <> "" Then
        listStr = Left(listStr, Len(listStr) - 1)
    Else
        listStr = "No Pending Requests"
    End If
    
    With wsApp.Range("C7").Validation
        .Delete
        .Add Type:=3, AlertStyle:=1, Operator:=1, Formula1:=listStr ' xlValidateList=3, xlValidAlertStop=1
        .IgnoreBlank = True
        .InCellDropdown = True
    End With
    wsApp.Range("C7").Value = ""
End Sub

Sub ApproveRequest()
    Call ActionRequest("Approved")
End Sub

Sub RejectRequest()
    Call ActionRequest("Rejected")
End Sub

Sub ActionRequest(status As String)
    Dim wsApp As Worksheet
    Dim wsDB As Worksheet
    Dim reqID As String
    Dim r As Long
    Dim found As Boolean
    
    Set wsApp = Sheets("Approval Center")
    Set wsDB = Sheets("RawDatabase")
    
    reqID = wsApp.Range("C7").Value
    If reqID = "" Or reqID = "No Pending Requests" Then
        MsgBox "Please select a valid pending Request ID from the dropdown.", vbExclamation + vbOKOnly, "Action Ignored"
        Exit Sub
    End If
    
    found = False
    For r = 6 To wsDB.Cells(wsDB.Rows.Count, "B").End(-4162).Row
        If wsDB.Cells(r, 2).Value = reqID Then
            wsDB.Cells(r, 13).Value = status
            wsDB.Cells(r, 14).Value = wsApp.Range("C11").Value ' Col N = Supervisor Reviewer
            found = True
            Exit For
        End If
    Next r
    
    If found Then
        MsgBox "Request " & reqID & " has been " & status & " successfully.", vbInformation + vbOKOnly, "Request Actioned"
        Call RefreshApprovalDropdown
        Application.Calculate
    Else
        MsgBox "Request not found in database.", vbCritical + vbOKOnly, "Error"
    End If
End Sub
"@

    $vbaMod.CodeModule.AddFromString($vbaCode)
    Write-Output "VBA backend loaded."

    # 8. Set technical worksheets to be hidden
    # xlSheetVeryHidden = 2 (users cannot unhide them via GUI!)
    $wsDatabase.Visible = 2
    $wsEmployeeMaster.Visible = 2
    $wsCalculations.Visible = 2
    Write-Output "Technical worksheets hidden."

    # 9. Force Excel to calculate formulas to initialize values
    $excel.Calculate()

    # 10. Save as xlOpenXMLWorkbookMacroEnabled = 52 (.xlsm)
    $outputPath = "c:\Users\shanson\Downloads\dinesmart-suite-main\Ghacem_Overtime_Portal.xlsm"
    $wb.SaveAs($outputPath, 52)
    Write-Output "Workbook saved successfully to: $outputPath"

} catch {
    Write-Output "Error occurred during spreadsheet creation:"
    Write-Output $_.Exception.Message
    exit 1
} finally {
    # Close workbook & quit Excel
    if ($wb -ne $null) { $wb.Close($false) }
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()

    # Restore AccessVBOM registry value
    if ($OldAccessVBOM -ne $null) {
        Set-ItemProperty -Path $RegPath -Name "AccessVBOM" -Value $OldAccessVBOM -Force
    } else {
        Remove-ItemProperty -Path $RegPath -Name "AccessVBOM" -Force -ErrorAction SilentlyContinue
    }
    Write-Output "VBA Trust settings restored."
}

Write-Output "Ghacem Overtime Portal generation complete!"
