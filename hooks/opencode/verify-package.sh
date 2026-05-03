#!/usr/bin/env bash
set -euo pipefail

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
