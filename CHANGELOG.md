# Changelog

## Unreleased

- Hardened Hermes runner startup so clean repositories initialize `.archaeology/session.json` without requiring prior setup.
- Added clear blocked-state handling for malformed Hermes session phases instead of allowing low-level `jq` failures.
- Added invalid JSON protection for Hermes session files so corrupted state is reported without being overwritten.
- Expanded CLI `doctor` checks and tests to verify Hermes hooks and integration docs are packaged alongside OpenCode assets.
- Aligned the exported analysis-tool type contract with the documented TypeScript, JavaScript, Python, Go, and Rust tool matrix.
- Updated install documentation to cover Hermes verification and troubleshooting parity with OpenCode.

## v2.0.2

- Added release-ready repository parity files: CI workflow, issue templates, PR template, security policy, contribution guide, and changelog.
- Added npm CLI and install documentation so users can install from npm, GitHub, or OpenCode plugin configuration paths.
- Added security audit and safety documentation covering local state, restore-mode review, dependency audit expectations, and secret-free examples.
- Prepared package metadata and package contents for npm release readiness, including docs, wiki source, assets, prompts, and release support files.

## v2.0.1

- Committed built `dist/` artifacts so GitHub-based installs can load the plugin without requiring a local build step.
- Updated installation and auto-update documentation.
- Bumped package version to `2.0.1`.

## v2.0.0

- Converted Code Archaeology into an OpenCode plugin.
- Added commands, hooks, policies, prompts, schema, and plugin packaging for survey, excavate, and restore workflows.
- Established the archaeology workflow for dead code, legacy cleanup, dependency mapping, type work, DRY review, error handling, and final catalog verification.
