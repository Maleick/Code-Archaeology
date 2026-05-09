#!/usr/bin/env bash
# cleanup.sh — Code Archaeology artifact cleanup
# Removes temporary analysis files while preserving Code Archaeology reports
# unless report deletion is explicitly opted into by the caller.

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHAEOLOGY_DIR="${REPO_ROOT}/.archaeology"
DELETE_EXPEDITION_REPORTS=0

usage() {
  echo "Usage: $(basename "$0") [--delete-expedition-reports]" >&2
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --delete-expedition-reports)
      DELETE_EXPEDITION_REPORTS=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

echo "Code Archaeology cleanup starting..."

if [ -L "$ARCHAEOLOGY_DIR" ]; then
  echo "refusing to clean symlinked archaeology directory: $ARCHAEOLOGY_DIR" >&2
  exit 1
fi

if [ ! -d "$ARCHAEOLOGY_DIR" ]; then
  echo "no archaeology directory found; nothing to clean"
  exit 0
fi

# Clean old expedition reports (>14 days) only when explicitly requested.
if [ "$DELETE_EXPEDITION_REPORTS" -eq 1 ]; then
  while IFS= read -r -d '' f; do
    rm -f -- "$f"
    echo "removed old report: $(basename -- "$f")"
  done < <(find "$ARCHAEOLOGY_DIR" -maxdepth 1 -type f -name 'expedition*-report.md' -mtime +14 -print0 2>/dev/null)
else
  echo "preserving expedition reports by default; rerun with --delete-expedition-reports to remove reports older than 14 days"
fi

# Clean old excavation logs
while IFS= read -r -d '' f; do
  rm -f -- "$f"
  echo "removed old log: $(basename -- "$f")"
done < <(find "$ARCHAEOLOGY_DIR" -maxdepth 1 -type f \( -name 'excavation_log.txt' -o -name 'excavation_log-*.txt' \) -mtime +14 -print0 2>/dev/null)

# Clean mock patch artifacts older than 7 days
if [ -d "$ARCHAEOLOGY_DIR/patches" ] && [ ! -L "$ARCHAEOLOGY_DIR/patches" ]; then
  while IFS= read -r -d '' f; do
    rm -f -- "$f"
    echo "removed old mock patch: $(basename -- "$f")"
  done < <(find "$ARCHAEOLOGY_DIR/patches" -type f -name '*.patch' -mtime +7 -print0 2>/dev/null)
fi

while IFS= read -r -d '' f; do
  rm -f -- "$f"
  echo "removed old patch index: $(basename -- "$f")"
done < <(find "$ARCHAEOLOGY_DIR" -maxdepth 1 -type f -name 'patch-index.json' -mtime +7 -print0 2>/dev/null)

# Report disk usage
du -sh "$ARCHAEOLOGY_DIR" 2>/dev/null || true
echo "Code Archaeology cleanup done"
