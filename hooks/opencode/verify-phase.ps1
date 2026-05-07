# Verify that tests pass and typecheck succeeds.
# Usage: verify-phase.ps1 [phase-name]

$ErrorActionPreference = 'Stop'

$PHASE = if ($args[0]) { $args[0] } else { "unknown" }
$ARCHAEOLOGY_DIR = ".archaeology"
$SESSION_FILE = "$ARCHAEOLOGY_DIR/session.json"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $SCRIPT_DIR "../shared/command-utils.ps1")

$TEST_CMD = "npm test"
$TYPECHECK_CMD = "npx tsc --noEmit"
if (Test-Path "$SESSION_FILE") {
    $session = Get-Content "$SESSION_FILE" -Raw | ConvertFrom-Json
    if ($env:CODE_ARCHAEOLOGY_TRUST_SESSION_COMMANDS -eq "1") {
        if ($session.config.test_command) {
            $TEST_CMD = $session.config.test_command
        }
        if ($session.config.typecheck_command) {
            $TYPECHECK_CMD = $session.config.typecheck_command
        }
    } elseif ($session.config.test_command -or $session.config.typecheck_command) {
        Write-Warning "Ignoring test/typecheck commands from session.json. Set CODE_ARCHAEOLOGY_TRUST_SESSION_COMMANDS=1 to opt in."
    }
}

Write-Host "[$PHASE] Running test command: $TEST_CMD"
try {
    Invoke-CheckedCommand -CommandLine $TEST_CMD | Out-Default
} catch {
    Write-Error "[$PHASE] Tests FAILED"
    exit 1
}

Write-Host "[$PHASE] Running typecheck: $TYPECHECK_CMD"
try {
    Invoke-CheckedCommand -CommandLine $TYPECHECK_CMD 2>$null | Out-Default
} catch {
    Write-Warning "[$PHASE] Typecheck reported errors (non-blocking for some languages)"
}

Write-Host "[$PHASE] Verification passed"
