## Unreleased

### Features

* document manual release reruns and workflow dispatch trigger settings in `docs/RELEASE.md` and `CONTRIBUTING.md`
* add Hermes integration docs coverage for `yolo` and explicit docs smoke coverage for `--yolo` across wiki/INTEGRATION pages

## [2.2.6](https://github.com/Maleick/Code-Archaeology/compare/v2.2.5...v2.2.6) (2026-05-07)


### Bug Fixes

* record completed timestamp for complete status ([#19](https://github.com/Maleick/Code-Archaeology/issues/19)) ([5e17231](https://github.com/Maleick/Code-Archaeology/commit/5e17231b095b7ae1e8615a1f0c55adedda15489f))

## [2.2.5](https://github.com/Maleick/Code-Archaeology/compare/v2.2.4...v2.2.5) (2026-05-07)


### Bug Fixes

* suppress workflow Node deprecation warnings ([#18](https://github.com/Maleick/Code-Archaeology/issues/18)) ([0a1c657](https://github.com/Maleick/Code-Archaeology/commit/0a1c657a91cf4f96c1b7ffd4650adcbdb621d487))

## [2.2.4](https://github.com/Maleick/Code-Archaeology/compare/v2.2.3...v2.2.4) (2026-05-07)


### Bug Fixes

* configure workflow git default branch ([#17](https://github.com/Maleick/Code-Archaeology/issues/17)) ([aa81fe6](https://github.com/Maleick/Code-Archaeology/commit/aa81fe66033dc9376b2aecdd3c522994bc4e270f))

## [2.2.3](https://github.com/Maleick/Code-Archaeology/compare/v2.2.2...v2.2.3) (2026-05-07)


### Bug Fixes

* suppress upstream Pages deprecation warning ([#16](https://github.com/Maleick/Code-Archaeology/issues/16)) ([85a6b8d](https://github.com/Maleick/Code-Archaeology/commit/85a6b8d7686dbb734d3934501ab9389920e2bfc5))

## [2.2.2](https://github.com/Maleick/Code-Archaeology/compare/v2.2.1...v2.2.2) (2026-05-07)


### Bug Fixes

* deploy pages with Node 24 actions ([#15](https://github.com/Maleick/Code-Archaeology/issues/15)) ([3d0fb9f](https://github.com/Maleick/Code-Archaeology/commit/3d0fb9fc168ab5b94229966a053fd58986076238))

## [2.2.1](https://github.com/Maleick/Code-Archaeology/compare/v2.2.0...v2.2.1) (2026-05-07)


### Bug Fixes

* opt actions into Node 24 runtime ([#14](https://github.com/Maleick/Code-Archaeology/issues/14)) ([1d2b797](https://github.com/Maleick/Code-Archaeology/commit/1d2b797c629ba0c3a7b9245cb596e3fac2c42cd7))

# [2.2.0](https://github.com/Maleick/Code-Archaeology/compare/v2.1.0...v2.2.0) (2026-05-07)


### Bug Fixes

* avoid session-sourced verification commands ([#10](https://github.com/Maleick/Code-Archaeology/issues/10)) ([9d3296d](https://github.com/Maleick/Code-Archaeology/commit/9d3296d1551ed7c97b90aca5c4be932bad5042e6))
* harden PowerShell verification hooks ([#6](https://github.com/Maleick/Code-Archaeology/issues/6)) ([ae1c1fa](https://github.com/Maleick/Code-Archaeology/commit/ae1c1fab3b1ce84872ad8217959d321e8e42266b))
* harden trusted publishing safety ([c78ee2e](https://github.com/Maleick/Code-Archaeology/commit/c78ee2e9bc75ff6554e75f848f64a3054a74344e))
* **hermes:** require operator approval for restore mode ([#8](https://github.com/Maleick/Code-Archaeology/issues/8)) ([772cd67](https://github.com/Maleick/Code-Archaeology/commit/772cd67df32f853c562fe8ed46f6d1528b477fda))
* only set completed_at when status is completed ([ebf1040](https://github.com/Maleick/Code-Archaeology/commit/ebf1040fb8a4a9ff23a40d6fa6042313e590b363))
* pass model router args safely ([#11](https://github.com/Maleick/Code-Archaeology/issues/11)) ([a7379fc](https://github.com/Maleick/Code-Archaeology/commit/a7379fcf425eab70f2906de75f0a158e7d418e85))
* secure Hermes session rewrites ([#7](https://github.com/Maleick/Code-Archaeology/issues/7)) ([55d5694](https://github.com/Maleick/Code-Archaeology/commit/55d5694684158d1ae471fed25b4f8de0706c7810))


### Features

* Add Windows/PowerShell support ([a6b74ea](https://github.com/Maleick/Code-Archaeology/commit/a6b74ea75c1eb60263e939df3dc27fa4cc8b7a72)), closes [#4](https://github.com/Maleick/Code-Archaeology/issues/4)

# [2.1.0](https://github.com/Maleick/Code-Archaeology/compare/v2.0.2...v2.1.0) (2026-05-05)


### Bug Fixes

* align analysis tool types ([65b19b2](https://github.com/Maleick/Code-Archaeology/commit/65b19b2b581c2e3f196f3d53886fd8dfdab23ea2))
* block invalid Hermes sessions ([aaafd4f](https://github.com/Maleick/Code-Archaeology/commit/aaafd4f0a0d6652ae92b5513caa13b2fabcab06e))
* harden Hermes install checks ([bc034cc](https://github.com/Maleick/Code-Archaeology/commit/bc034cca6cb8af88287cc3656cd72adf8a4246c1))
* remove embedded worktree and ignore .autoship/ ([400b554](https://github.com/Maleick/Code-Archaeology/commit/400b55452f96f604074d73f6eea79cf996a91aad))
* remove stale PluginServer stub ([#3](https://github.com/Maleick/Code-Archaeology/issues/3)) ([f8b15a3](https://github.com/Maleick/Code-Archaeology/commit/f8b15a306f55cfa6e036cc05e115357ec68df023)), closes [#2](https://github.com/Maleick/Code-Archaeology/issues/2)


### Features

* **hermes:** add full Hermes Agent runtime support ([2f4ad41](https://github.com/Maleick/Code-Archaeology/commit/2f4ad41060994802c1fb3c5a480e88728838130b)), closes [#hermes-support](https://github.com/Maleick/Code-Archaeology/issues/hermes-support) [#multi-runtime](https://github.com/Maleick/Code-Archaeology/issues/multi-runtime)
* prepare v2.1.0 release ([54507d4](https://github.com/Maleick/Code-Archaeology/commit/54507d423b421535116363be86fbcba30b161d9e))
* **routing:** add intelligent model routing for free-tier priority ([a456556](https://github.com/Maleick/Code-Archaeology/commit/a45655602106933de64a0af5b63e18e6378847d7))

# Changelog

## Unreleased

- Switched release publishing to npm trusted publishing with GitHub Actions OIDC.
- Hardened Hermes restore mode so it blocks explicitly until implemented instead of reporting a successful no-op restore.
- Changed OpenCode revert handling to preserve failed phase changes in a named git stash instead of dropping them.
- Exposed public type definitions through package exports and excluded the repo-local legacy plugin shim from npm package contents.

## v2.1.0

- Changed `/code-archaeology` to run the full 10-phase survey chain by default without per-phase prompts.
- Kept the default OpenCode flow non-destructive: survey mode writes report artifacts under `.archaeology/` only.
- Clarified that `/code-archaeology-restore` remains the explicit command for applying source changes.
- Updated command, CLI, plugin, and release tests for the new default survey-chain behavior.

## v2.0.3

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
