# Shared PowerShell command parsing and execution helpers for verification hooks.

function Convert-CommandElementToArgument {
    param(
        [Parameter(Mandatory=$true)]
        [System.Management.Automation.Language.CommandElementAst]$Element,

        [Parameter(Mandatory=$true)]
        [string]$CommandLine
    )

    if ($Element -is [System.Management.Automation.Language.StringConstantExpressionAst]) {
        return $Element.Value
    }

    if ($Element -is [System.Management.Automation.Language.ExpandableStringExpressionAst]) {
        return $Element.Value
    }

    if ($Element -is [System.Management.Automation.Language.ConstantExpressionAst]) {
        return [string]$Element.Value
    }

    if ($Element -is [System.Management.Automation.Language.CommandParameterAst]) {
        if ($null -ne $Element.Argument) {
            $argumentValue = Convert-CommandElementToArgument -Element $Element.Argument -CommandLine $CommandLine
            return "-$($Element.ParameterName):$argumentValue"
        }

        return "-$($Element.ParameterName)"
    }

    throw "Unsupported command syntax in command: $CommandLine"
}

function Split-CommandLine {
    param([Parameter(Mandatory=$true)][string]$CommandLine)

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
    if ($commandAst.Redirections.Count -gt 0) {
        throw "Command must not contain redirections: $CommandLine"
    }

    $parts = [System.Collections.Generic.List[string]]::new()
    foreach ($element in $commandAst.CommandElements) {
        $parts.Add((Convert-CommandElementToArgument -Element $element -CommandLine $CommandLine))
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
    if ($resolvedCommand -is [System.Management.Automation.AliasInfo]) {
        $resolvedCommand = $resolvedCommand.ResolvedCommand
    }

    $isExternalApplication = $resolvedCommand.CommandType -eq [System.Management.Automation.CommandTypes]::Application
    if ($isExternalApplication) {
        $global:LASTEXITCODE = 0
    }

    & $command @arguments

    if ($isExternalApplication) {
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) {
            throw "Command failed with exit code $exitCode: $CommandLine"
        }
        return
    }

    if (-not $?) {
        throw "Command failed: $CommandLine"
    }
}
