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
find "$ARCHAEOLOGY_DIR" -maxdepth 1 -type f -name 'excavation_log-*.txt' -mtime +14 2>/dev/null | while read -r f; do
  rm -f "$f"
  echo "removed old log: $(basename "$f")"
done

# Clean mock patches older than 7 days
find "$ARCHAEOLOGY_DIR" -maxdepth 1 -type d -name 'mock-patches-*' -mtime +7 2>/dev/null | while read -r dir; do
  rm -rf "$dir"
  echo "removed old mock patches: $(basename "$dir")"
done

# Report disk usage
du -sh "$ARCHAEOLOGY_DIR" 2>/dev/null || true
echo "Code Archaeology cleanup done"
