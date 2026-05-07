# Move current working tree changes into a recoverable stash.
# Usage: revert-phase.ps1 [phase-name]

$ErrorActionPreference = 'Stop'

$PHASE = if ($args[0]) { $args[0] } else { "unknown" }

Write-Host "[$PHASE] Reverting changes due to failure..."

git stash push -m "code-archaeology-revert-$PHASE" --include-untracked *> $null

Write-Host "[$PHASE] Changes preserved in git stash"
