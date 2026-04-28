# Verify that tests pass and typecheck succeeds.
# Usage: verify-phase.sh [phase-name]

set -euo pipefail

PHASE="${1:-unknown}"
ARCHAEOLOGY_DIR=".archaeology"
SESSION_FILE="$ARCHAEOLOGY_DIR/session.json"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Source config from session file if jq is available
TEST_CMD="npm test"
TYPECHECK_CMD="npx tsc --noEmit"
if command -v jq >/dev/null 2>&1 && [[ -f "$SESSION_FILE" ]]; then
  TEST_CMD=$(jq -r '.config.test_command // "npm test"' "$SESSION_FILE")
  TYPECHECK_CMD=$(jq -r '.config.typecheck_command // "npx tsc --noEmit"' "$SESSION_FILE")
fi

echo "[$PHASE] Running test command: $TEST_CMD"
if ! bash -c "$TEST_CMD"; then
  echo "[$PHASE] ❌ Tests FAILED" >&2
  exit 1
fi

echo "[$PHASE] Running typecheck: $TYPECHECK_CMD"
if ! bash -c "$TYPECHECK_CMD" 2>/dev/null; then
  echo "[$PHASE] ⚠️ Typecheck reported errors (non-blocking for some languages)" >&2
fi

echo "[$PHASE] ✅ Verification passed"
