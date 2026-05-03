# Security Audit Notes

These notes capture the current release-readiness security posture for Code Archaeology. They are intended to accompany the release checklist and should be refreshed before each publication.

## Current Findings

- `npm audit --audit-level=moderate` is expected to be clean for the current dependency set.
- `npm outdated --json` is expected to be clean for the current dependency set.
- No hardcoded secrets are expected in source, docs, hooks, commands, prompts, schemas, or package metadata.
- `.archaeology/` is local runtime state and is ignored by Git.
- `.superpowers/` is local planning state and is ignored by Git.
- Shell hooks in `hooks/opencode/` are syntax-checkable with `bash -n hooks/opencode/*.sh`.

## Local State

Code Archaeology writes operational state into `.archaeology/` in the target repository. This directory can contain project structure, findings, generated reports, mock patches, and restoration logs. It should stay local unless a maintainer intentionally extracts a report for review.

## Restore-Mode Safety Caveat

`restore` mode can modify source files. It should only run after `survey` reports are reviewed, preferably after `excavate` mock patches are reviewed, and only when the target repository has tests or type checks available. Failed restore phases should be reverted with the bundled revert hook before continuing.

The tool must not remove try/catch blocks around I/O or external input boundaries automatically, and uncertain type replacements should be flagged for human review instead of guessed.

## Release Checklist

Before publishing a release:

```bash
npm install
npm run build
npm run typecheck
npm audit --audit-level=moderate
npm outdated --json
bash -n hooks/opencode/*.sh
npm pack --json --dry-run
```

Inspect the package dry run for required files and for accidental inclusion of local state. Do not publish if `.archaeology/`, `.superpowers/`, credentials, logs, or editor state appear in the package contents.
