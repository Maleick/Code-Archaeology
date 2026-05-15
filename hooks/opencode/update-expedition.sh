#!/usr/bin/env bash
# Update expedition status in session.json
# Usage: update-expedition.sh <phase> <status> [findings_count] [error_message]

set -euo pipefail

# ── Auto-sync: pull latest plugin code before update ──
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
  if jq --arg phase "$PHASE" \
        --arg status "$STATUS" \
        --argjson findings "$FINDINGS" \
        --arg error "$ERROR" \
        --arg now "$NOW" \
        '(.expeditions[] | select(.phase == $phase)) |= (
          .status = $status |
          .findings_count = $findings |
          if $status == "running" then .started_at = $now else . end |
          if $status == "complete" then .completed_at = $now else del(.completed_at?) end |
          if $error != "" then .error = $error else del(.error?) end
        ) | .updated_at = $now | .total_findings = ([.expeditions[].findings_count] | add // 0)' \
        "$SESSION_FILE" > "$local_tmp"; then
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
