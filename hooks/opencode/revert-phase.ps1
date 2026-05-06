# Revert changes in the current working tree back to the last commit.
# Usage: revert-phase.ps1 [phase-name]

$ErrorActionPreference = 'Stop'

$PHASE = if ($args[0]) { $args[0] } else { "unknown" }

Write-Host "[$PHASE] Reverting changes due to failure..."

# Stash any changes and drop them
git stash push -m "code-archaeology-revert-$PHASE" --include-untracked 2>$null
if ($?) {
    git stash drop 2>$null
}

# Reset to HEAD
git reset --hard HEAD

Write-Host "[$PHASE] Reverted to last commit"
