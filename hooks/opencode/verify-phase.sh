#!/usr/bin/env bash
# Verify that tests pass and typecheck succeeds.
# Usage: verify-phase.sh [phase-name]

set -euo pipefail

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
