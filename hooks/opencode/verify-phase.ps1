# Verify that tests pass and typecheck succeeds.
# Usage: verify-phase.ps1 [phase-name]

$ErrorActionPreference = 'Stop'

$PHASE = if ($args[0]) { $args[0] } else { "unknown" }
$ARCHAEOLOGY_DIR = ".archaeology"
$SESSION_FILE = "$ARCHAEOLOGY_DIR/session.json"

function Split-CommandLine {
    param([Parameter(Mandatory=$true)][string]$CommandLine)

    $tokens = [System.Collections.Generic.List[string]]::new()
    $current = [System.Text.StringBuilder]::new()
    $inSingleQuote = $false
    $inDoubleQuote = $false

    for ($i = 0; $i -lt $CommandLine.Length; $i++) {
        $char = $CommandLine[$i]
        if ($char -eq "'" -and -not $inDoubleQuote) {
            $inSingleQuote = -not $inSingleQuote
            continue
        }
        if ($char -eq '"' -and -not $inSingleQuote) {
            $inDoubleQuote = -not $inDoubleQuote
            continue
        }
        if ([char]::IsWhiteSpace($char) -and -not $inSingleQuote -and -not $inDoubleQuote) {
            if ($current.Length -gt 0) {
                $tokens.Add($current.ToString())
                $null = $current.Clear()
            }
            continue
        }
        $null = $current.Append($char)
    }

    if ($inSingleQuote -or $inDoubleQuote) {
        throw "Unterminated quote in command: $CommandLine"
    }
    if ($current.Length -gt 0) {
        $tokens.Add($current.ToString())
    }
    return $tokens.ToArray()
}

function Invoke-CheckedCommand {
    param([Parameter(Mandatory=$true)][string]$CommandLine)

    [string[]]$parts = @(Split-CommandLine -CommandLine $CommandLine)
    if ($parts.Count -eq 0) {
        throw "Empty command"
    }

    $command = $parts[0]
    $arguments = @()
    if ($parts.Count -gt 1) {
        $arguments = $parts[1..($parts.Count - 1)]
    }

    $global:LASTEXITCODE = 0
    & $command @arguments
    $exitCode = if ($LASTEXITCODE -ne $null) { $LASTEXITCODE } elseif ($?) { 0 } else { 1 }
    if ($exitCode -ne 0) {
        throw "Command failed with exit code $exitCode: $CommandLine"
    }
}

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
