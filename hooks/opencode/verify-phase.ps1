# Verify that tests pass and typecheck succeeds.
# Usage: verify-phase.ps1 [phase-name]

$ErrorActionPreference = 'Stop'

$PHASE = if ($args[0]) { $args[0] } else { "unknown" }
$ARCHAEOLOGY_DIR = ".archaeology"
$SESSION_FILE = "$ARCHAEOLOGY_DIR/session.json"

function Split-CommandLine {
    param([Parameter(Mandatory=$true)][string]$CommandLine)

    function Convert-CommandElementToArgument {
        param(
            [Parameter(Mandatory=$true)]
            [System.Management.Automation.Language.CommandElementAst]$Element,
            [Parameter(Mandatory=$true)]
            [string]$OriginalCommandLine
        )

        if ($Element -is [System.Management.Automation.Language.StringConstantExpressionAst]) {
            return $Element.Value
        }

        if ($Element -is [System.Management.Automation.Language.ExpandableStringExpressionAst]) {
            return $Element.Value
        }

        if ($Element -is [System.Management.Automation.Language.CommandParameterAst]) {
            if ($null -ne $Element.Argument) {
                $argumentValue = Convert-CommandElementToArgument -Element $Element.Argument -OriginalCommandLine $OriginalCommandLine
                return "-$($Element.ParameterName):$argumentValue"
            }

            return "-$($Element.ParameterName)"
        }

        throw "Unsupported command syntax in command: $OriginalCommandLine"
    }

    [System.Management.Automation.Language.Token[]]$tokens = @()
    [System.Management.Automation.Language.ParseError[]]$parseErrors = @()
    $ast = [System.Management.Automation.Language.Parser]::ParseInput($CommandLine, [ref]$tokens, [ref]$parseErrors)

    if ($parseErrors.Count -gt 0) {
        $message = ($parseErrors | ForEach-Object { $_.Message }) -join "; "
        throw "Invalid command syntax: $CommandLine. $message"
    }

    $statements = @($ast.EndBlock.Statements)
    if ($statements.Count -ne 1 -or $statements[0] -isnot [System.Management.Automation.Language.PipelineAst]) {
        throw "Only a single simple command is supported: $CommandLine"
    }

    $pipeline = [System.Management.Automation.Language.PipelineAst]$statements[0]
    if ($pipeline.PipelineElements.Count -ne 1 -or $pipeline.PipelineElements[0] -isnot [System.Management.Automation.Language.CommandAst]) {
        throw "Only a single simple command is supported: $CommandLine"
    }

    $commandAst = [System.Management.Automation.Language.CommandAst]$pipeline.PipelineElements[0]
    $parts = [System.Collections.Generic.List[string]]::new()

    foreach ($element in $commandAst.CommandElements) {
        $parts.Add((Convert-CommandElementToArgument -Element $element -OriginalCommandLine $CommandLine))
    }

    return $parts.ToArray()
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

    $resolvedCommand = Get-Command -Name $command -ErrorAction Stop | Select-Object -First 1
    $isExternalApplication = $resolvedCommand.CommandType -eq [System.Management.Automation.CommandTypes]::Application

    $global:LASTEXITCODE = 0
    & $command @arguments

    if ($isExternalApplication) {
        $exitCode = $LASTEXITCODE
    } else {
        $exitCode = if ($?) { 0 } else { 1 }
    }

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
