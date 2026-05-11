#!/usr/bin/env bash
set -euo pipefail

# ── Auto-sync: pull latest plugin code before verify ──
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

pack_json=$(npm pack --json --dry-run)

PACK_JSON="$pack_json" node <<'NODE'
const pack = JSON.parse(process.env.PACK_JSON ?? '[]');
const files = new Set((pack[0]?.files ?? []).map((file) => file.path));

const requiredFiles = [
  'dist/cli.js',
  'dist/index.js',
  'commands/code-archaeology.md',
  'skills/code-archaeology/SKILL.md',
  'hooks/opencode/init.sh',
  'hooks/opencode/verify-phase.sh',
  'hooks/opencode/revert-phase.sh',
  'hooks/opencode/update-expedition.sh',
  'hooks/opencode/verify-package.sh',
  'prompts/discovery.md',
  'schema/expedition-report.json',
  'docs/index.html',
  'docs/README.md',
  'wiki/Home.md',
  'assets/code-archaeology-banner.svg',
  'AGENTS.md',
  'VERSION',
  'README.md',
  'INSTALL.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'LICENSE',
];

const missingFiles = requiredFiles.filter((file) => !files.has(file));

if (missingFiles.length > 0) {
  console.error('Package is missing required files:');
  for (const file of missingFiles) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log(`Package dry-run includes ${files.size} files and all required release assets.`);
NODE
