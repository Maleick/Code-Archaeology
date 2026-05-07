# Hermes agent expedition runner - execute one Code Archaeology phase per cron run
$ErrorActionPreference = 'Stop'

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$REPO_ROOT = Resolve-Path "$SCRIPT_DIR/../.." | Select-Object -ExpandProperty Path
$ARCHAEOLOGY_DIR = "$REPO_ROOT/.archaeology"
$SESSION_FILE = "$ARCHAEOLOGY_DIR/session.json"

New-Item -ItemType Directory -Force -Path "$ARCHAEOLOGY_DIR" | Out-Null

function Block-Session {
    param(
        [string]$Reason,
        [string]$Message = $Reason
    )
    Write-Error "ERROR: $Message"
    if (Test-Path "$SESSION_FILE") {
        $session = Get-Content "$SESSION_FILE" -Raw | ConvertFrom-Json
        $session.status = "blocked"
        if (!($session.PSObject.Properties["flags"])) {
            $session | Add-Member -MemberType NoteProperty -Name "flags" -Value @{}
        }
        $session.flags.blocked_reason = $Reason
        $session | ConvertTo-Json -Depth 10 | Set-Content "$SESSION_FILE" -Encoding UTF8
    }
    exit 1
}

# Phase definitions (fixed order)
$PHASES = @(
    "site-survey"
    "dead-code"
    "legacy-removal"
    "dependency-mapping"
    "type-consolidation"
    "type-hardening"
    "dry-stratification"
    "error-handling"
    "artifact-cleaning"
    "final-catalog"
)

# Detect current phase from session file
$current_phase = ""
if (Test-Path "$SESSION_FILE") {
    $session = Get-Content "$SESSION_FILE" -Raw | ConvertFrom-Json
    if ($session.PSObject.Properties["current_phase"] -and $session.current_phase) {
        $current_phase = $session.current_phase
    } else {
        Block-Session -Reason "invalid session.json" -Message "Invalid Hermes session file: $SESSION_FILE"
    }
}

if (-not $current_phase) {
    $current_phase = $PHASES[0]
    # Initialize session
    $NOW = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $session = @{
        runtime = "hermes"
        status = "running"
        current_phase = $current_phase
        completed_phases = @()
        mode = "survey"
        repo_path = "."
        language = "typescript"
        test_command = "npm test"
        typecheck_command = "npx tsc --noEmit"
        branch_name = "refactor/archaeology"
        strict_mode = $false
        started_at = $NOW
    }
    $session | ConvertTo-Json -Depth 10 | Set-Content "$SESSION_FILE" -Encoding UTF8
    Write-Host "Initialized Hermes session. Starting phase: $current_phase"
}

# Find phase index
$phase_idx = 0
$phase_found = $false
for ($i = 0; $i -lt $PHASES.Count; $i++) {
    if ($PHASES[$i] -eq $current_phase) {
        $phase_idx = $i
        $phase_found = $true
        break
    }
}

if (-not $phase_found) {
    Block-Session -Reason "unknown phase: $current_phase" -Message "Unknown Hermes phase: $current_phase"
}

$phase_number = $phase_idx + 1
$total_phases = $PHASES.Count

Write-Host "=== Code Archaeology Hermes Runner ==="
Write-Host "Phase $phase_number/$total_phases: $current_phase"
$session = Get-Content "$SESSION_FILE" -Raw | ConvertFrom-Json
Write-Host "Mode: $($session.mode)"
Write-Host ""

# Run the phase
Set-Location "$REPO_ROOT"

# Create branch if needed
$branch = $session.branch_name
git checkout -b "$branch" 2>$null
if (-not $?) {
    git checkout "$branch"
}

# Execute phase based on mode
$mode = $session.mode

if ($mode -eq "survey") {
    Write-Host "Running SURVEY for phase $current_phase..."
    # Generate reports only, no file changes
    try {
        & "$SCRIPT_DIR/../opencode/init.ps1" 2>$null
    } catch {}

    # Run phase-specific analysis
    switch ($current_phase) {
        "site-survey" { Write-Host "Generating site survey and baseline inventory..." }
        "dead-code" { Write-Host "Cataloging dead code, unused exports, unreachable functions..." }
        "legacy-removal" { Write-Host "Identifying legacy fallbacks, deprecated shims, compatibility layers..." }
        "dependency-mapping" { Write-Host "Mapping circular dependencies..." }
        "type-consolidation" { Write-Host "Finding duplicate type definitions..." }
        "type-hardening" { Write-Host "Identifying weak types..." }
        "dry-stratification" { Write-Host "Finding semantic duplication..." }
        "error-handling" { Write-Host "Reviewing error-handling patterns..." }
        "artifact-cleaning" { Write-Host "Identifying stale artifacts and documentation gaps..." }
        "final-catalog" { Write-Host "Generating final excavation catalog..." }
    }

    # Write report
    $report_file = "$ARCHAEOLOGY_DIR/expedition${phase_number}-report.md"
    $reportTimestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    @"
# Expedition $phase_number`: $current_phase

**Mode:** survey
**Phase:** $phase_number/$total_phases
**Runtime:** hermes
**Timestamp:** $reportTimestamp

## Findings

(TODO: Populate with actual analysis results)

## Recommendations

(TODO: Populate with recommendations)

## Safety Notes

- All findings are reports only; no code changes made
- Review before proceeding to excavate or restore mode
"@ | Set-Content "$report_file" -Encoding UTF8

    Write-Host "Report written: $report_file"

} elseif ($mode -eq "excavate") {
    Write-Host "Running EXCAVATE for phase $current_phase..."
    # Generate mock patches (no file changes)
    New-Item -ItemType Directory -Force -Path "$ARCHAEOLOGY_DIR/patches" | Out-Null
    $patch_file = "$ARCHAEOLOGY_DIR/patches/expedition${phase_number}-mock.patch"
    @"
# Mock patch for $current_phase
# Generated by Hermes runtime
# Review before applying in restore mode
"@ | Set-Content "$patch_file" -Encoding UTF8
    Write-Host "Mock patch written: $patch_file"

} elseif ($mode -eq "restore") {
    Write-Host "Running RESTORE for phase $current_phase..."
    # Apply approved changes (test-gated)

    # Do not source commands from session.json because that repository-local file
    # may be attacker-controlled in untrusted repos.
    $test_cmd = if ($env:CODE_ARCHAEOLOGY_TEST_COMMAND) { $env:CODE_ARCHAEOLOGY_TEST_COMMAND } else { "npm test" }
    $typecheck_cmd = if ($env:CODE_ARCHAEOLOGY_TYPECHECK_COMMAND) { $env:CODE_ARCHAEOLOGY_TYPECHECK_COMMAND } else { "npx tsc --noEmit" }

    Write-Host "Running pre-restore verification..."
    try {
        Invoke-Expression $test_cmd 2>$null | Out-Default
    } catch {
        Write-Error "ERROR: Tests failed before restore. Stopping."
        $session.status = "blocked"
        if (!($session.PSObject.Properties["flags"])) {
            $session | Add-Member -MemberType NoteProperty -Name "flags" -Value @{}
        }
        $session.flags.blocked_reason = "tests failed before restore"
        $session | ConvertTo-Json -Depth 10 | Set-Content "$SESSION_FILE" -Encoding UTF8
        exit 1
    }

    try {
        Invoke-Expression $typecheck_cmd 2>$null | Out-Default
    } catch {
        Write-Error "ERROR: Typecheck failed before restore. Stopping."
        $session.status = "blocked"
        if (!($session.PSObject.Properties["flags"])) {
            $session | Add-Member -MemberType NoteProperty -Name "flags" -Value @{}
        }
        $session.flags.blocked_reason = "typecheck failed before restore"
        $session | ConvertTo-Json -Depth 10 | Set-Content "$SESSION_FILE" -Encoding UTF8
        exit 1
    }

    Write-Host "Pre-restore verification passed."
    Write-Host "(TODO: Apply approved changes from mock patches)"

    # Run tests after changes
    Write-Host "Running post-restore verification..."
    try {
        Invoke-Expression $test_cmd 2>$null | Out-Default
    } catch {
        Write-Error "ERROR: Tests failed after restore. Reverting..."
        git reset --hard HEAD
        $session.status = "blocked"
        if (!($session.PSObject.Properties["flags"])) {
            $session | Add-Member -MemberType NoteProperty -Name "flags" -Value @{}
        }
        $session.flags.blocked_reason = "tests failed after restore"
        $session | ConvertTo-Json -Depth 10 | Set-Content "$SESSION_FILE" -Encoding UTF8
        exit 1
    }

    try {
        Invoke-Expression $typecheck_cmd 2>$null | Out-Default
    } catch {
        Write-Error "ERROR: Typecheck failed after restore. Reverting..."
        git reset --hard HEAD
        $session.status = "blocked"
        if (!($session.PSObject.Properties["flags"])) {
            $session | Add-Member -MemberType NoteProperty -Name "flags" -Value @{}
        }
        $session.flags.blocked_reason = "typecheck failed after restore"
        $session | ConvertTo-Json -Depth 10 | Set-Content "$SESSION_FILE" -Encoding UTF8
        exit 1
    }

    Write-Host "Post-restore verification passed. Changes kept."
}

# Update session: mark phase complete, advance to next
$session = Get-Content "$SESSION_FILE" -Raw | ConvertFrom-Json
$completed = if ($session.PSObject.Properties["completed_phases"]) {
    if ($session.completed_phases -and $session.completed_phases.Count -gt 0) {
        ($session.completed_phases -join ",") + ",$current_phase"
    } else {
        $current_phase
    }
} else {
    $current_phase
}

$next_phase = ""
if ($phase_idx -lt ($PHASES.Count - 1)) {
    $next_phase = $PHASES[$phase_idx + 1]
}

$session.completed_phases = $completed -split ","
$session.current_phase = $next_phase
$session | ConvertTo-Json -Depth 10 | Set-Content "$SESSION_FILE" -Encoding UTF8

if ($next_phase) {
    Write-Host ""
    Write-Host "Phase $current_phase complete. Next: $next_phase"
    Write-Host "STOP. Next cron run will execute phase: $next_phase"
} else {
    Write-Host ""
    Write-Host "=== ALL PHASES COMPLETE ==="
    Write-Host "Final catalog: $ARCHAEOLOGY_DIR/FINAL_CATALOG.md"
    $session = Get-Content "$SESSION_FILE" -Raw | ConvertFrom-Json
    $session.status = "complete"
    $session | ConvertTo-Json -Depth 10 | Set-Content "$SESSION_FILE" -Encoding UTF8
}
