# Revert changes in the current working tree back to the last commit.
# Usage: revert-phase.sh [phase-name]

set -euo pipefail

PHASE="${1:-unknown}"

echo "[$PHASE] ⚠️ Reverting changes due to failure..."

# Stash any changes and drop them
git stash push -m "code-archaeology-revert-$PHASE" --include-untracked 2>/dev/null || true
git stash drop 2>/dev/null || true

# Reset to HEAD
git reset --hard HEAD

echo "[$PHASE] ✅ Reverted to last commit"
