# Update expedition status in session.json
# Usage: update-expedition.sh <phase> <status> [findings_count] [error_message]

set -euo pipefail

PHASE="$1"
STATUS="$2"
FINDINGS="${3:-0}"
ERROR="${4:-}"

ARCHAEOLOGY_DIR=".archaeology"
SESSION_FILE="$ARCHAEOLOGY_DIR/session.json"

if [[ -L "$SESSION_FILE" ]]; then
  echo "Error: session.json is a symlink. Refusing to update symlinked session file." >&2
  exit 1
fi

if [[ ! -f "$SESSION_FILE" ]]; then
  echo "Error: session.json not found. Run init.sh first." >&2
  exit 1
fi

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if command -v jq >/dev/null 2>&1; then
  local_tmp=$(mktemp "$ARCHAEOLOGY_DIR/session.json.XXXXXX")
  if [[ -n "$ERROR" ]]; then
    jq_args=(--arg phase "$PHASE" --arg status "$STATUS" --argjson findings "$FINDINGS" --arg error "$ERROR" --arg now "$NOW")
    jq_filter='(.expeditions[] | select(.phase == $phase)) |= (.status = $status | .findings_count = $findings | .error = $error | if $status == "running" then .started_at = $now else . end | if $status == "complete" then .completed_at = $now else . end) | .updated_at = $now | .total_findings = ([.expeditions[].findings_count] | add // 0)'
  else
    jq_args=(--arg phase "$PHASE" --arg status "$STATUS" --argjson findings "$FINDINGS" --arg now "$NOW")
    jq_filter='(.expeditions[] | select(.phase == $phase)) |= (.status = $status | .findings_count = $findings | if $status == "running" then .started_at = $now else . end | if $status == "complete" then .completed_at = $now else . end) | .updated_at = $now | .total_findings = ([.expeditions[].findings_count] | add // 0)'
  fi
  if jq "${jq_args[@]}" "$jq_filter" "$SESSION_FILE" > "$local_tmp"; then
    chmod 600 "$local_tmp" 2>/dev/null || true
    mv -f "$local_tmp" "$SESSION_FILE"
  else
    rm -f "$local_tmp"
    echo "Error: failed to update session" >&2
    exit 1
  fi

  echo "[$PHASE] Updated status: $STATUS (findings: $FINDINGS)"
else
  echo "[$PHASE] Status: $STATUS (findings: $FINDINGS) [jq not available, session not updated]"
fi
