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

# ── Auto-sync: pull latest plugin code before init ──
if [[ -z "${CODE_ARCHAEOLOGY_NO_SYNC:-}" ]]; then
  # Only sync if we have a valid git remote/default branch (skip temp/policy-test repos)
  if git rev-parse --verify HEAD >/dev/null 2>&1 && git remote get-url origin >/dev/null 2>&1; then
    remote_ref=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)
    remote_ref="${remote_ref:-origin/main}"
    if git rev-parse --verify "${remote_ref}^{commit}" >/dev/null 2>&1; then
      sync_gap=$(git log --oneline "HEAD..$remote_ref" 2>/dev/null | wc -l | tr -d ' ') || sync_gap=0
      if [[ "$sync_gap" =~ ^[0-9]+$ && "$sync_gap" -gt 0 ]]; then
        remote_branch="${remote_ref#origin/}"
        echo "[code-archaeology-sync] $sync_gap commit(s) behind $remote_ref — pulling..."
        git pull origin "$remote_branch" >/dev/null 2>&1 || echo "[code-archaeology-sync] WARN: git pull failed, continuing with local code"
      fi
    fi
  fi
fi

echo "Code Archaeology v${PLUGIN_VERSION} initializing..."

if ! command -v jq >/dev/null 2>&1; then
  echo "Warning: jq not found. Install with: brew install jq" >&2
fi

mkdir -p "$ARCHAEOLOGY_DIR"
mkdir -p "$ARCHAEOLOGY_DIR/patches"

# Initialize session.json
if [[ ! -f "$SESSION_FILE" ]]; then
  NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  SESSION_ID="archaeology-$(date -u +%s)-$$"
  BASELINE_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
  
  jq -n \
    --arg sid "$SESSION_ID" \
    --arg now "$NOW" \
    --arg ver "$PLUGIN_VERSION" \
    --arg baseline "$BASELINE_COMMIT" \
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
        branch_name: "refactor/archaeology"
      },
      started_at: $now,
      updated_at: $now,
      expeditions: [
        {phase: "survey", name: "Site Survey \u0026 Baseline", status: "pending", findings_count: 0},
        {phase: "dead_code", name: "Dead Code Excavation", status: "pending", findings_count: 0},
        {phase: "legacy", name: "Legacy Stratum Removal", status: "pending", findings_count: 0},
        {phase: "dependencies", name: "Circular Dependency Cartography", status: "pending", findings_count: 0},
        {phase: "types_consolidate", name: "Type Catalog Consolidation", status: "pending", findings_count: 0},
        {phase: "types_harden", name: "Type Restoration \u0026 Hardening", status: "pending", findings_count: 0},
        {phase: "dry", name: "DRY Stratification", status: "pending", findings_count: 0},
        {phase: "errors", name: "Error Handling Stratigraphy", status: "pending", findings_count: 0},
        {phase: "polish", name: "Artifact Cleaning \u0026 Documentation", status: "pending", findings_count: 0},
        {phase: "final_verify", name: "Site Preservation \u0026 Final Catalog", status: "pending", findings_count: 0}
      ],
      total_findings: 0,
      auto_fixable_count: 0,
      baseline_commit: $baseline,
      completed: false
    }' > "$SESSION_FILE"
  echo "Initialized $SESSION_FILE"
else
  NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  jq --arg now "$NOW" \
     --arg ver "$PLUGIN_VERSION" \
     '.updated_at = $now | .plugin_version = $ver' \
     "$SESSION_FILE" > "$SESSION_FILE.tmp" && mv "$SESSION_FILE.tmp" "$SESSION_FILE"
  echo "Refreshed $SESSION_FILE"
fi

echo "Code Archaeology workspace ready at $ARCHAEOLOGY_DIR"
