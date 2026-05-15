#!/usr/bin/env bash
# Initialize .archaeology/ directory for Code Archaeology.

set -euo pipefail

ARCHAEOLOGY_DIR=".archaeology"
SESSION_FILE="$ARCHAEOLOGY_DIR/session.json"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RELEASE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
if [[ -f "$RELEASE_ROOT/VERSION" ]]; then
  PLUGIN_VERSION="$(tr -d '[:space:]' < "$RELEASE_ROOT/VERSION")"
else
  PLUGIN_VERSION="dev"
fi

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "Error: not inside a git repository" >&2
  exit 1
}
cd "$REPO_ROOT"

echo "Code Archaeology v${PLUGIN_VERSION} initializing..."

if ! command -v jq >/dev/null 2>&1; then
  echo "Warning: jq not found. Install with: brew install jq" >&2
fi

mkdir -p "$ARCHAEOLOGY_DIR"
mkdir -p "$ARCHAEOLOGY_DIR/patches"

if [[ -L "$SESSION_FILE" ]]; then
  echo "Error: session.json is a symlink. Refusing to write to symlinked session file." >&2
  exit 1
fi

# Initialize session.json
if [[ ! -f "$SESSION_FILE" ]]; then
  NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  SESSION_ID="archaeology-$(date -u +%s)-$$"
  BASELINE_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
  BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

  tmp=$(mktemp "$ARCHAEOLOGY_DIR/session.json.XXXXXX")
  if jq -n \
    --arg sid "$SESSION_ID" \
    --arg now "$NOW" \
    --arg ver "$PLUGIN_VERSION" \
    --arg baseline "$BASELINE_COMMIT" \
    --arg branch "$BRANCH_NAME" \
    '{
      version: 1,
      plugin_version: $ver,
      session_id: $sid,
      config: {
        repo_path: ".",
        language: "typescript",
        mode: "survey",
        strict_mode: false,
        test_command: "npm test",
        typecheck_command: "npx tsc --noEmit",
        branch_name: $branch
      },
      started_at: $now,
      updated_at: $now,
      expeditions: [
        {phase: "survey", name: "Site Survey & Baseline", status: "pending", findings_count: 0},
        {phase: "dead_code", name: "Dead Code Excavation", status: "pending", findings_count: 0},
        {phase: "legacy", name: "Legacy Stratum Removal", status: "pending", findings_count: 0},
        {phase: "dependencies", name: "Circular Dependency Cartography", status: "pending", findings_count: 0},
        {phase: "types_consolidate", name: "Type Catalog Consolidation", status: "pending", findings_count: 0},
        {phase: "types_harden", name: "Type Restoration & Hardening", status: "pending", findings_count: 0},
        {phase: "dry", name: "DRY Stratification", status: "pending", findings_count: 0},
        {phase: "errors", name: "Error Handling Stratigraphy", status: "pending", findings_count: 0},
        {phase: "polish", name: "Artifact Cleaning & Documentation", status: "pending", findings_count: 0},
        {phase: "final_verify", name: "Site Preservation & Final Catalog", status: "pending", findings_count: 0}
      ],
      total_findings: 0,
      auto_fixable_count: 0,
      baseline_commit: $baseline,
      completed: false
    }' > "$tmp"; then
    chmod 600 "$tmp" 2>/dev/null || true
    mv -f "$tmp" "$SESSION_FILE"
  else
    rm -f "$tmp"
    echo "Error: failed to initialize session" >&2
    exit 1
  fi
  echo "Initialized $SESSION_FILE"
else
  NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  tmp=$(mktemp "$ARCHAEOLOGY_DIR/session.json.XXXXXX")
  if jq --arg now "$NOW" \
        --arg ver "$PLUGIN_VERSION" \
        '.updated_at = $now | .plugin_version = $ver' \
        "$SESSION_FILE" > "$tmp"; then
    chmod 600 "$tmp" 2>/dev/null || true
    mv -f "$tmp" "$SESSION_FILE"
  else
    rm -f "$tmp"
    echo "Error: failed to refresh session" >&2
    exit 1
  fi
  echo "Refreshed $SESSION_FILE"
fi

echo "Code Archaeology workspace ready at $ARCHAEOLOGY_DIR"
