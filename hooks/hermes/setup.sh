#!/usr/bin/env bash
# Hermes agent setup — discover Hermes capabilities for Code Archaeology
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ── Auto-sync: pull latest plugin code before setup ──
if [[ -z "${CODE_ARCHAEOLOGY_NO_SYNC:-}" ]]; then
  cd "$REPO_ROOT" || exit 1
  # Only sync if we have a valid git remote (skip temp/policy-test repos)
  if git rev-parse --verify HEAD >/dev/null 2>&1 && git remote get-url origin >/dev/null 2>&1; then
    sync_gap=$(git log --oneline HEAD..origin/main 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$sync_gap" =~ ^[0-9]+$ && "$sync_gap" -gt 0 ]]; then
      echo "[code-archaeology-sync] $sync_gap commit(s) behind origin/main — pulling..."
      git pull origin main >/dev/null 2>&1 || echo "[code-archaeology-sync] WARN: git pull failed, continuing with local code"
    fi
  fi
fi

ARCHAEOLOGY_DIR="$REPO_ROOT/.archaeology"

mkdir -p "$ARCHAEOLOGY_DIR"

# Check if Hermes CLI is available
HERMES_AVAILABLE=false
if command -v hermes &>/dev/null; then
  HERMES_AVAILABLE=true
fi

# Check if we're running inside a Hermes session
HERMES_ACTIVE=false
if [[ -n "${HERMES_SESSION_ID:-}" || -n "${HERMES_CWD:-}" || -n "${HERMES_PROVIDER:-}" ]]; then
  HERMES_ACTIVE=true
fi

# Write Hermes runtime config
cat > "$ARCHAEOLOGY_DIR/hermes-runtime.json" <<EOF
{
  "runtime": "hermes",
  "available": $HERMES_AVAILABLE,
  "active_session": $HERMES_ACTIVE,
  "max_concurrent": 1,
  "dispatch_method": "cronjob",
  "phase_interval": "15m",
  "notes": "Code Archaeology runs one expedition phase per cron run. Test gates between phases."
}
EOF

echo "Hermes runtime configured for Code Archaeology:"
echo "  CLI available: $HERMES_AVAILABLE"
echo "  Active session: $HERMES_ACTIVE"
echo "  Max concurrent: 1 (one phase at a time)"
echo "  Phase interval: 15 minutes"
echo "  Config: $ARCHAEOLOGY_DIR/hermes-runtime.json"
