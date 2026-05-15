# Verify that tests pass and typecheck succeeds.
# Usage: verify-phase.sh [phase-name]

set -euo pipefail

# ── Auto-sync: pull latest plugin code before verify ──
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
ARCHAEOLOGY_DIR=".archaeology"
SESSION_FILE="$ARCHAEOLOGY_DIR/session.json"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Verification commands must not be read from repository-local state.
# A malicious repository can pre-seed .archaeology/session.json; executing commands
# from that file would cross the repository-to-workstation trust boundary.
# Operators who intentionally need custom commands can approve them explicitly via
# environment variables for the current process.
TEST_CMD="${CODE_ARCHAEOLOGY_TEST_COMMAND:-npm test}"
TYPECHECK_CMD="${CODE_ARCHAEOLOGY_TYPECHECK_COMMAND:-npx tsc --noEmit}"

echo "[$PHASE] Running test command: $TEST_CMD"
if ! bash -c "$TEST_CMD"; then
  echo "[$PHASE] ❌ Tests FAILED" >&2
  exit 1
fi

echo "[$PHASE] Running typecheck: $TYPECHECK_CMD"
if ! bash -c "$TYPECHECK_CMD"; then
  echo "[$PHASE] ❌ Typecheck FAILED" >&2
  exit 1
fi

echo "[$PHASE] ✅ Verification passed"
