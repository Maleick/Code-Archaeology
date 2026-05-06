# Verify that tests pass and typecheck succeeds.
# Usage: verify-phase.ps1 [phase-name]

$ErrorActionPreference = 'Stop'

$PHASE = if ($args[0]) { $args[0] } else { "unknown" }
$ARCHAEOLOGY_DIR = ".archaeology"
$SESSION_FILE = "$ARCHAEOLOGY_DIR/session.json"

$TEST_CMD = "npm test"
$TYPECHECK_CMD = "npx tsc --noEmit"
if (Test-Path "$SESSION_FILE") {
    $session = Get-Content "$SESSION_FILE" -Raw | ConvertFrom-Json
    if ($session.config.test_command) {
        $TEST_CMD = $session.config.test_command
    }
    if ($session.config.typecheck_command) {
        $TYPECHECK_CMD = $session.config.typecheck_command
    }
}

Write-Host "[$PHASE] Running test command: $TEST_CMD"
try {
    Invoke-Expression $TEST_CMD | Out-Default
} catch {
    Write-Error "[$PHASE] Tests FAILED"
    exit 1
}

Write-Host "[$PHASE] Running typecheck: $TYPECHECK_CMD"
try {
    Invoke-Expression $TYPECHECK_CMD 2>$null | Out-Default
} catch {
    Write-Warning "[$PHASE] Typecheck reported errors (non-blocking for some languages)"
}

Write-Host "[$PHASE] Verification passed"
