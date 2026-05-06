# Hermes agent setup - discover Hermes capabilities for Code Archaeology
$ErrorActionPreference = 'Stop'

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$REPO_ROOT = Resolve-Path "$SCRIPT_DIR/../.." | Select-Object -ExpandProperty Path
$ARCHAEOLOGY_DIR = "$REPO_ROOT/.archaeology"

New-Item -ItemType Directory -Force -Path "$ARCHAEOLOGY_DIR" | Out-Null

# Check if Hermes CLI is available
$HERMES_AVAILABLE = $false
try {
    $null = Get-Command hermes -ErrorAction Stop
    $HERMES_AVAILABLE = $true
} catch {}

# Check if we're running inside a Hermes session
$HERMES_ACTIVE = $false
if ($env:HERMES_SESSION_ID -or $env:HERMES_CWD -or $env:HERMES_PROVIDER) {
    $HERMES_ACTIVE = $true
}

# Write Hermes runtime config
$hermesRuntime = @{
    runtime = "hermes"
    available = $HERMES_AVAILABLE
    active_session = $HERMES_ACTIVE
    max_concurrent = 1
    dispatch_method = "cronjob"
    phase_interval = "15m"
    notes = "Code Archaeology runs one expedition phase per cron run. Test gates between phases."
}

$hermesRuntime | ConvertTo-Json -Depth 5 | Set-Content "$ARCHAEOLOGY_DIR/hermes-runtime.json" -Encoding UTF8

Write-Host "Hermes runtime configured for Code Archaeology:"
Write-Host "  CLI available: $HERMES_AVAILABLE"
Write-Host "  Active session: $HERMES_ACTIVE"
Write-Host "  Max concurrent: 1 (one phase at a time)"
Write-Host "  Phase interval: 15 minutes"
Write-Host "  Config: $ARCHAEOLOGY_DIR/hermes-runtime.json"
