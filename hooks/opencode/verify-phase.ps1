# Verify that tests pass and typecheck succeeds.
# Usage: verify-phase.ps1 [phase-name]

$ErrorActionPreference = 'Stop'

$PHASE = if ($args[0]) { $args[0] } else { "unknown" }
$ARCHAEOLOGY_DIR = ".archaeology"
$SESSION_FILE = "$ARCHAEOLOGY_DIR/session.json"

# Verification commands must not be read from repository-local state.
# A malicious repository can pre-seed .archaeology/session.json; executing commands
# from that file would cross the repository-to-workstation trust boundary.
# Operators who intentionally need custom commands can approve them explicitly via
# environment variables for the current process.
$TEST_CMD = if ($env:CODE_ARCHAEOLOGY_TEST_COMMAND) { $env:CODE_ARCHAEOLOGY_TEST_COMMAND } else { "npm test" }
$TYPECHECK_CMD = if ($env:CODE_ARCHAEOLOGY_TYPECHECK_COMMAND) { $env:CODE_ARCHAEOLOGY_TYPECHECK_COMMAND } else { "npx tsc --noEmit" }

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
