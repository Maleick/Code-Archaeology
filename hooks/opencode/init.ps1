# Initialize .archaeology/ directory for Code Archaeology.

$ErrorActionPreference = 'Stop'

$ARCHAEOLOGY_DIR = ".archaeology"
$SESSION_FILE = "$ARCHAEOLOGY_DIR/session.json"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$RELEASE_ROOT = Resolve-Path "$SCRIPT_DIR/../.." | Select-Object -ExpandProperty Path
if (Test-Path "$RELEASE_ROOT/VERSION") {
    $PLUGIN_VERSION = (Get-Content "$RELEASE_ROOT/VERSION" -Raw).Trim()
} else {
    $PLUGIN_VERSION = "dev"
}

$REPO_ROOT = $null
try {
    $REPO_ROOT = (git rev-parse --show-toplevel 2>$null).Trim()
} catch {
    Write-Error "Error: not inside a git repository"
    exit 1
}
Set-Location "$REPO_ROOT"

Write-Host "Code Archaeology v${PLUGIN_VERSION} initializing..."

New-Item -ItemType Directory -Force -Path "$ARCHAEOLOGY_DIR" | Out-Null
New-Item -ItemType Directory -Force -Path "$ARCHAEOLOGY_DIR/patches" | Out-Null

# Guard against symlink-based write redirection (Set-Content follows symlinks on Windows)
$_sessionItem = Get-Item "$SESSION_FILE" -ErrorAction SilentlyContinue
if ($null -ne $_sessionItem -and $_sessionItem.LinkType -eq "SymbolicLink") {
    Write-Error "Error: session.json is a symlink. Refusing to write to symlinked session file."
    exit 1
}

# Initialize session.json
if (!(Test-Path "$SESSION_FILE")) {
    $NOW = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $SESSION_ID = "archaeology-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())-$PID"
    $BASELINE_COMMIT = "unknown"
    try {
        $BASELINE_COMMIT = (git rev-parse HEAD 2>$null).Trim()
    } catch {}
    $BRANCH_NAME = "unknown"
    try {
        $BRANCH_NAME = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
    } catch {}

    $session = @{
        version = 1
        plugin_version = $PLUGIN_VERSION
        session_id = $SESSION_ID
        config = @{
            repo_path = "."
            language = "typescript"
            mode = "survey"
            strict_mode = $false
            test_command = "npm test"
            typecheck_command = "npx tsc --noEmit"
            branch_name = $BRANCH_NAME
        }
        started_at = $NOW
        updated_at = $NOW
        expeditions = @(
            @{phase = "survey"; name = "Site Survey & Baseline"; status = "pending"; findings_count = 0}
            @{phase = "dead_code"; name = "Dead Code Excavation"; status = "pending"; findings_count = 0}
            @{phase = "legacy"; name = "Legacy Stratum Removal"; status = "pending"; findings_count = 0}
            @{phase = "dependencies"; name = "Circular Dependency Cartography"; status = "pending"; findings_count = 0}
            @{phase = "types_consolidate"; name = "Type Catalog Consolidation"; status = "pending"; findings_count = 0}
            @{phase = "types_harden"; name = "Type Restoration & Hardening"; status = "pending"; findings_count = 0}
            @{phase = "dry"; name = "DRY Stratification"; status = "pending"; findings_count = 0}
            @{phase = "errors"; name = "Error Handling Stratigraphy"; status = "pending"; findings_count = 0}
            @{phase = "polish"; name = "Artifact Cleaning & Documentation"; status = "pending"; findings_count = 0}
            @{phase = "final_verify"; name = "Site Preservation & Final Catalog"; status = "pending"; findings_count = 0}
        )
        total_findings = 0
        auto_fixable_count = 0
        baseline_commit = $BASELINE_COMMIT
        completed = $false
    }

    $session | ConvertTo-Json -Depth 10 | Set-Content "$SESSION_FILE" -Encoding UTF8
    Write-Host "Initialized $SESSION_FILE"
} else {
    $NOW = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $session = Get-Content "$SESSION_FILE" -Raw | ConvertFrom-Json
    $session.updated_at = $NOW
    $session.plugin_version = $PLUGIN_VERSION
    $session | ConvertTo-Json -Depth 10 | Set-Content "$SESSION_FILE" -Encoding UTF8
    Write-Host "Refreshed $SESSION_FILE"
}

Write-Host "Code Archaeology workspace ready at $ARCHAEOLOGY_DIR"
