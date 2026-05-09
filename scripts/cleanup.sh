#!/usr/bin/env bash
# cleanup.sh — Code Archaeology artifact cleanup
# Removes old expedition reports and temporary analysis files while preserving
# the latest survey and final catalog.

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHAEOLOGY_DIR="${REPO_ROOT}/.archaeology"

echo "Code Archaeology cleanup starting..."

# Clean old expedition reports (>14 days), keep FINAL_CATALOG.md and latest survey
find "$ARCHAEOLOGY_DIR" -maxdepth 1 -type f -name 'expedition*-report.md' -mtime +14 2>/dev/null | while read -r f; do
  rm -f "$f"
  echo "removed old report: $(basename "$f")"
done

# Clean old excavation logs
find "$ARCHAEOLOGY_DIR" -maxdepth 1 -type f \( -name 'excavation_log.txt' -o -name 'excavation_log-*.txt' \) -mtime +14 2>/dev/null | while read -r f; do
  rm -f "$f"
  echo "removed old log: $(basename "$f")"
done

# Clean mock patch artifacts older than 7 days
find "$ARCHAEOLOGY_DIR/patches" -type f -name '*.patch' -mtime +7 2>/dev/null | while read -r f; do
  rm -f "$f"
  echo "removed old mock patch: $(basename "$f")"
done

find "$ARCHAEOLOGY_DIR" -maxdepth 1 -type f -name 'patch-index.json' -mtime +7 2>/dev/null | while read -r f; do
  rm -f "$f"
  echo "removed old patch index: $(basename "$f")"
done

# Report disk usage
du -sh "$ARCHAEOLOGY_DIR" 2>/dev/null || true
echo "Code Archaeology cleanup done"
