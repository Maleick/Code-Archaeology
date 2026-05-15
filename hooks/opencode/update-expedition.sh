# Update expedition status in session.json
# Usage: update-expedition.sh <phase> <status> [findings_count] [error_message]

set -euo pipefail

PHASE="$1"
STATUS="$2"
FINDINGS="${3:-0}"
ERROR="${4:-}"

ARCHAEOLOGY_DIR=".archaeology"
SESSION_FILE="$ARCHAEOLOGY_DIR/session.json"

if [[ ! -f "$SESSION_FILE" ]]; then
  echo "Error: session.json not found. Run init.sh first." >&2
  exit 1
fi

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if command -v jq >/dev/null 2>&1; then
  local_tmp=$(mktemp "$ARCHAEOLOGY_DIR/session.json.XXXXXX")
  if [[ -n "$ERROR" ]]; then
    if jq --arg phase "$PHASE" \
          --arg status "$STATUS" \
          --argjson findings "$FINDINGS" \
          --arg error "$ERROR" \
          --arg now "$NOW" \
          '(.expeditions[] | select(.phase == $phase)) |= (.status = $status | .findings_count = $findings | .error = $error | .completed_at = $now) | .updated_at = $now' \
          "$SESSION_FILE" > "$local_tmp"; then
      chmod 600 "$local_tmp" 2>/dev/null || true
      mv -f "$local_tmp" "$SESSION_FILE"
    else
      rm -f "$local_tmp"
      echo "Error: failed to update session" >&2
      exit 1
    fi
  else
    if jq --arg phase "$PHASE" \
          --arg status "$STATUS" \
          --argjson findings "$FINDINGS" \
          --arg now "$NOW" \
          '(.expeditions[] | select(.phase == $phase)) |= (.status = $status | .findings_count = $findings | .completed_at = $now) | .updated_at = $now' \
          "$SESSION_FILE" > "$local_tmp"; then
      chmod 600 "$local_tmp" 2>/dev/null || true
      mv -f "$local_tmp" "$SESSION_FILE"
    else
      rm -f "$local_tmp"
      echo "Error: failed to update session" >&2
      exit 1
    fi
  fi

  # Update total findings
  local_tmp=$(mktemp "$ARCHAEOLOGY_DIR/session.json.XXXXXX")
  if jq '(.total_findings = ([.expeditions[].findings_count] | add // 0))' \
        "$SESSION_FILE" > "$local_tmp"; then
    chmod 600 "$local_tmp" 2>/dev/null || true
    mv -f "$local_tmp" "$SESSION_FILE"
  else
    rm -f "$local_tmp"
    echo "Error: failed to update total_findings" >&2
    exit 1
  fi

  echo "[$PHASE] Updated status: $STATUS (findings: $FINDINGS)"
else
  echo "[$PHASE] Status: $STATUS (findings: $FINDINGS) [jq not available, session not updated]"
fi
