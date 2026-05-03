# Security And Safety

[Home](Home) | [Installation](Installation) | [Workflow](Expedition-Workflow) | [Release](Release-Process)

## Current Audit Notes

- `npm audit --audit-level=moderate` is expected to be clean.
- `npm outdated --json` is expected to be clean.
- No hardcoded secrets are expected in source, docs, hooks, commands, prompts, schemas, or metadata.
- `.archaeology/` and `.superpowers/` are ignored local state.
- Shell hooks can be syntax checked with `bash -n hooks/opencode/*.sh`.

## Restore Caveat

`restore` mode can edit source files. Run it only after reviewing `survey` reports, preferably after reviewing `excavate` mock patches, and only when tests or type checks are available.

Failed restore phases should be reverted before continuing. The workflow must not remove try/catch blocks around I/O or external input boundaries automatically, and uncertain type replacements should be flagged for review.

## Before Publishing

Run build, typecheck, npm audit, npm outdated, shell syntax checks, and `npm pack --json --dry-run`. Inspect the package contents for accidental local state or secrets before publishing.
