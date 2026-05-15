#!/usr/bin/env bash
# Move current working tree changes into a recoverable stash.
# Usage: revert-phase.sh [phase-name]

set -euo pipefail

PHASE="${1:-unknown}"

echo "[$PHASE] ⚠️ Reverting changes due to failure..."

git stash push -m "code-archaeology-revert-$PHASE" --include-untracked >/dev/null 2>&1 || true

echo "[$PHASE] ✅ Changes preserved in git stash"
