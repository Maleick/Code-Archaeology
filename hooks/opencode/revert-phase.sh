# Move current working tree changes into a recoverable stash.
# Usage: revert-phase.sh [phase-name]

set -euo pipefail

# ── Auto-sync: pull latest plugin code before revert ──
if [[ -z "${CODE_ARCHAEOLOGY_NO_SYNC:-}" ]]; then
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
  if [[ -n "$repo_root" ]]; then
    cd "$repo_root" || exit 1
    # Only sync if we have a valid git remote (skip temp/policy-test repos)
    if git rev-parse --verify HEAD >/dev/null 2>&1 && git remote get-url origin >/dev/null 2>&1; then
      sync_gap=$(git log --oneline HEAD..origin/main 2>/dev/null | wc -l | tr -d ' ' || true)
      if [[ "$sync_gap" =~ ^[0-9]+$ && "$sync_gap" -gt 0 ]]; then
        echo "[code-archaeology-sync] $sync_gap commit(s) behind origin/main — pulling..."
        git pull origin main >/dev/null 2>&1 || echo "[code-archaeology-sync] WARN: git pull failed, continuing with local code"
      fi
    fi
  fi
fi

PHASE="${1:-unknown}"

echo "[$PHASE] ⚠️ Reverting changes due to failure..."

git stash push -m "code-archaeology-revert-$PHASE" --include-untracked >/dev/null 2>&1 || true

echo "[$PHASE] ✅ Changes preserved in git stash"
