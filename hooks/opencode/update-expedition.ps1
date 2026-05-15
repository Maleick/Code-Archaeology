# Update expedition status in session.json
# Usage: update-expedition.ps1 <phase> <status> [findings_count] [error_message]

$ErrorActionPreference = 'Stop'

$PHASE = $args[0]
$STATUS = $args[1]
$FINDINGS = if ($args[2]) { [int]$args[2] } else { 0 }
$ERROR_MSG = if ($args[3]) { $args[3] } else { "" }

$ARCHAEOLOGY_DIR = ".archaeology"
$SESSION_FILE = "$ARCHAEOLOGY_DIR/session.json"

$_sessionItem = Get-Item "$SESSION_FILE" -ErrorAction SilentlyContinue
if ($null -ne $_sessionItem -and $_sessionItem.LinkType -eq "SymbolicLink") {
    Write-Error "Error: session.json is a symlink. Refusing to update symlinked session file."
    exit 1
}

if (!(Test-Path "$SESSION_FILE")) {
    Write-Error "Error: session.json not found. Run init.ps1 first."
    exit 1
}

$NOW = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$session = Get-Content "$SESSION_FILE" -Raw | ConvertFrom-Json

foreach ($expedition in $session.expeditions) {
    if ($expedition.phase -eq $PHASE) {
        $expedition.status = $STATUS
        $expedition.findings_count = $FINDINGS
        if ($STATUS -eq "running") {
            $expedition | Add-Member -MemberType NoteProperty -Name "started_at" -Value $NOW -Force
        }
        if ($STATUS -eq "complete") {
            $expedition | Add-Member -MemberType NoteProperty -Name "completed_at" -Value $NOW -Force
        }
        if ($ERROR_MSG) {
            $expedition | Add-Member -MemberType NoteProperty -Name "error" -Value $ERROR_MSG -Force
        } else {
            if ($expedition.PSObject.Properties["error"]) {
                $expedition.PSObject.Properties.Remove("error")
            }
        }
    }
}

$session.updated_at = $NOW

# Update total findings
$total = 0
foreach ($expedition in $session.expeditions) {
    $total += $expedition.findings_count
}
$session.total_findings = $total

$session | ConvertTo-Json -Depth 10 | Set-Content "$SESSION_FILE" -Encoding UTF8

Write-Host "[$PHASE] Updated status: $STATUS (findings: $FINDINGS)"
