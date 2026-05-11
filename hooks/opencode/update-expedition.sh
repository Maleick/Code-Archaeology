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
  if [[ -n "$ERROR" ]]; then
    jq --arg phase "$PHASE" \
       --arg status "$STATUS" \
       --argjson findings "$FINDINGS" \
       --arg error "$ERROR" \
       --arg now "$NOW" \
       '(.expeditions[] | select(.phase == $phase)) |= (.status = $status | .findings_count = $findings | .error = $error | .completed_at = $now) | .updated_at = $now' \
       "$SESSION_FILE" > "$SESSION_FILE.tmp" && mv "$SESSION_FILE.tmp" "$SESSION_FILE"
  else
    jq --arg phase "$PHASE" \
       --arg status "$STATUS" \
       --argjson findings "$FINDINGS" \
       --arg now "$NOW" \
       '(.expeditions[] | select(.phase == $phase)) |= (.status = $status | .findings_count = $findings | .completed_at = $now) | .updated_at = $now' \
       "$SESSION_FILE" > "$SESSION_FILE.tmp" && mv "$SESSION_FILE.tmp" "$SESSION_FILE"
  fi
  
  # Update total findings
  jq '(.total_findings = ([.expeditions[].findings_count] | add // 0))' \
     "$SESSION_FILE" > "$SESSION_FILE.tmp" && mv "$SESSION_FILE.tmp" "$SESSION_FILE"
     
  echo "[$PHASE] Updated status: $STATUS (findings: $FINDINGS)"
else
  echo "[$PHASE] Status: $STATUS (findings: $FINDINGS) [jq not available, session not updated]"
fi
