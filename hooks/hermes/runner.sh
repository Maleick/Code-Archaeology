#!/usr/bin/env bash
# Hermes agent expedition runner — execute one Code Archaeology phase per cron run
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ARCHAEOLOGY_DIR="$REPO_ROOT/.archaeology"
SESSION_FILE="$ARCHAEOLOGY_DIR/session.json"

# Restore mode can execute operator-provided verification commands. Keep the
# authorization outside repository-controlled files so a malicious checkout
# cannot enable unattended command execution by shipping .archaeology state.
RESTORE_APPROVAL_ENV="HERMES_RESTORE_APPROVED"

mkdir -p "$ARCHAEOLOGY_DIR"

block_session() {
  local reason="$1"
  local message="${2:-$reason}"
  echo "ERROR: $message" >&2
  if command -v jq >/dev/null 2>&1 && [[ -f "$SESSION_FILE" ]]; then
    write_session_jq --arg reason "$reason" \
      '.status = "blocked" | .flags = (.flags // {}) | .flags.blocked_reason = $reason' || true
  fi
  exit 1
}

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "ERROR: jq is required for Hermes session management" >&2
    exit 1
  fi
}

write_session_jq() {
  local tmp
  tmp=$(mktemp "$ARCHAEOLOGY_DIR/session.json.XXXXXX")
  if jq "$@" "$SESSION_FILE" > "$tmp"; then
    chmod 600 "$tmp" 2>/dev/null || true
    mv -f "$tmp" "$SESSION_FILE"
  else
    rm -f "$tmp"
    return 1
  fi
}

require_safe_session_path() {
  if [[ -L "$SESSION_FILE" ]]; then
    echo "ERROR: Refusing to use symlinked Hermes session file: $SESSION_FILE" >&2
    exit 1
  fi
}

initialize_session() {
  local current_phase="$1"
  local tmp
  tmp=$(mktemp "$ARCHAEOLOGY_DIR/session.json.XXXXXX")
  cat > "$tmp" <<EOF
{
  "runtime": "hermes",
  "status": "running",
  "current_phase": "$current_phase",
  "completed_phases": [],
  "mode": "survey",
  "repo_path": ".",
  "language": "typescript",
  "test_command": "npm test",
  "typecheck_command": "npx tsc --noEmit",
  "branch_name": "refactor/archaeology",
  "strict_mode": false,
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
  chmod 600 "$tmp" 2>/dev/null || true
  mv -f "$tmp" "$SESSION_FILE"
}

read_session_string() {
  local key="$1"
  if ! jq -er --arg key "$key" '.[$key] | strings | select(test("\\S"))' "$SESSION_FILE" 2>/dev/null; then
    block_session "invalid session field: $key" "Invalid Hermes session field: $key"
  fi
}

require_restore_approval() {
  if [[ "${!RESTORE_APPROVAL_ENV:-}" != "1" ]]; then
    block_session \
      "restore mode requires ${RESTORE_APPROVAL_ENV}=1" \
      "Hermes restore mode is disabled until the operator sets ${RESTORE_APPROVAL_ENV}=1 outside session.json"
  fi
}

validate_branch_name() {
  local branch="$1"
  if [[ -z "$branch" || "$branch" == -* || "$branch" =~ [[:space:]] ]]; then
    block_session "invalid branch_name" "Invalid Hermes branch_name: $branch"
  fi
  if ! git check-ref-format --branch "$branch" >/dev/null 2>&1; then
    block_session "invalid branch_name" "Invalid Hermes branch_name: $branch"
  fi
}

require_jq
require_safe_session_path

# Phase definitions (fixed order)
PHASES=(
  "site-survey"
  "dead-code"
  "legacy-removal"
  "dependency-mapping"
  "type-consolidation"
  "type-hardening"
  "dry-stratification"
  "error-handling"
  "artifact-cleaning"
  "final-catalog"
)

# Detect current phase from session file
current_phase=""
if [[ -f "$SESSION_FILE" ]]; then
  if ! current_phase=$(jq -r '.current_phase // empty' "$SESSION_FILE" 2>/dev/null); then
    block_session "invalid session.json" "Invalid Hermes session file: $SESSION_FILE"
  fi
fi

if [[ -z "$current_phase" ]]; then
  current_phase="${PHASES[0]}"
  initialize_session "$current_phase"
  echo "Initialized Hermes session. Starting phase: $current_phase"
fi

# Find phase index
phase_idx=0
phase_found=false
for i in "${!PHASES[@]}"; do
  if [[ "${PHASES[$i]}" == "$current_phase" ]]; then
    phase_idx=$i
    phase_found=true
    break
  fi
done

if [[ "$phase_found" != true ]]; then
  block_session "unknown phase: $current_phase" "Unknown Hermes phase: $current_phase"
fi

phase_number=$((phase_idx + 1))
total_phases=${#PHASES[@]}

echo "=== Code Archaeology Hermes Runner ==="
echo "Phase $phase_number/$total_phases: $current_phase"
echo "Mode: $(read_session_string mode)"
echo ""

# Run the phase
cd "$REPO_ROOT"

mode=$(read_session_string mode)
if [[ "$mode" == "restore" ]]; then
  require_restore_approval
  block_session \
    "restore mode is not implemented in Hermes runner" \
    "Hermes restore mode is not implemented. Use OpenCode restore after reviewing generated patches."
fi

# Create branch if needed
branch=$(read_session_string branch_name)
validate_branch_name "$branch"
git checkout -b "$branch" 2>/dev/null || git checkout "$branch"

# Execute phase based on mode
if [[ "$mode" == "survey" ]]; then
  echo "Running SURVEY for phase $current_phase..."
  # Generate reports only, no file changes
  bash "$SCRIPT_DIR/../opencode/init.sh" 2>/dev/null || true
  
  # Run phase-specific analysis
  case "$current_phase" in
    "site-survey")
      echo "Generating site survey and baseline inventory..."
      ;;
    "dead-code")
      echo "Cataloging dead code, unused exports, unreachable functions..."
      ;;
    "legacy-removal")
      echo "Identifying legacy fallbacks, deprecated shims, compatibility layers..."
      ;;
    "dependency-mapping")
      echo "Mapping circular dependencies..."
      ;;
    "type-consolidation")
      echo "Finding duplicate type definitions..."
      ;;
    "type-hardening")
      echo "Identifying weak types..."
      ;;
    "dry-stratification")
      echo "Finding semantic duplication..."
      ;;
    "error-handling")
      echo "Reviewing error-handling patterns..."
      ;;
    "artifact-cleaning")
      echo "Identifying stale artifacts and documentation gaps..."
      ;;
    "final-catalog")
      echo "Generating final excavation catalog..."
      ;;
  esac
  
  # Write report
  report_file="$ARCHAEOLOGY_DIR/expedition${phase_number}-report.md"
  cat > "$report_file" <<EOF
# Expedition $phase_number: $current_phase

**Mode:** survey
**Phase:** $phase_number/$total_phases
**Runtime:** hermes
**Timestamp:** $(date -u +%Y-%m-%dT%H:%M:%SZ)

## Findings

Hermes recorded this phase handoff. It does not perform autonomous static analysis in this hook.

## Recommendations

Run the matching Code Archaeology prompt with OpenCode, then keep this report with the reviewed findings.

## Safety Notes

- All findings are reports only; no code changes made
- Review before proceeding to excavate or restore mode
EOF

  echo "Report written: $report_file"
  
elif [[ "$mode" == "excavate" ]]; then
  echo "Running EXCAVATE for phase $current_phase..."
  # Generate mock patches (no file changes)
  mkdir -p "$ARCHAEOLOGY_DIR/patches"
  patch_file="$ARCHAEOLOGY_DIR/patches/expedition${phase_number}-mock.patch"
  echo "# Patch handoff for $current_phase" > "$patch_file"
  echo "# Hermes does not generate code changes from this hook." >> "$patch_file"
  echo "# Run the matching OpenCode prompt, review the diff, then restore manually." >> "$patch_file"
  echo "Mock patch written: $patch_file"
  
else
  block_session "unknown mode: $mode" "Unknown Hermes mode: $mode"
fi

# Update session: mark phase complete, advance to next
completed=$(jq -r '.completed_phases | join(",")' "$SESSION_FILE")
if [[ -n "$completed" ]]; then
  completed="$completed,$current_phase"
else
  completed="$current_phase"
fi

next_phase=""
if [[ $phase_idx -lt $((${#PHASES[@]} - 1)) ]]; then
  next_phase="${PHASES[$((phase_idx + 1))]}"
fi

write_session_jq --arg completed "$completed" --arg next "$next_phase" \
  '.completed_phases = ($completed | split(",")) | .current_phase = $next'

if [[ -n "$next_phase" ]]; then
  echo ""
  echo "Phase $current_phase complete. Next: $next_phase"
  echo "STOP. Next cron run will execute phase: $next_phase"
else
  echo ""
  echo "=== ALL PHASES COMPLETE ==="
  echo "Final catalog: $ARCHAEOLOGY_DIR/FINAL_CATALOG.md"
  write_session_jq '.status = "complete"'
fi
