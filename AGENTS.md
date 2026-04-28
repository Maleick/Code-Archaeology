# Code Archaeology Agent Guide

Code Archaeology is an OpenCode plugin for systematic codebase excavation, cataloging, and restoration.

## Runtime Policy

- OpenCode is the only supported worker runtime.
- The plugin operates entirely within the target repository.
- All changes are isolated to a configurable branch (`refactor/archaeology` by default).

## Available Hooks

Core hooks in `hooks/opencode/`:
- `init.sh` — Initialize `.archaeology/` directory and session state
- `verify-phase.sh` — Run tests and typecheck between phases
- `revert-phase.sh` — Revert changes if a phase fails verification
- `update-expedition.sh` — Update expedition status in session.json

## Safety Hooks

- `verify-phase.sh` — Mandatory test/typecheck gate between expeditions
- `revert-phase.sh` — Automatic rollback on failure

## Workflow

1. Run `hooks/opencode/init.sh` to initialize the session
2. For each expedition:
   a. Run the expedition (generate reports or apply changes)
   b. Run `hooks/opencode/verify-phase.sh <phase>` to verify
   c. If verification fails, run `hooks/opencode/revert-phase.sh <phase>`
   d. Run `hooks/opencode/update-expedition.sh <phase> <status> [findings]`
3. Final verification runs all checks and generates `FINAL_CATALOG.md`

## Local State

`.archaeology/` is runtime state and must not be committed.

Key files:
- `session.json` — Expedition progress and configuration
- `site_survey.md` — Baseline inventory
- `expedition1-report.md` through `expedition8-report.md` — Per-expedition findings
- `FINAL_CATALOG.md` — Completed excavation summary
- `excavation_log.txt` — `git diff --stat`
- `patches/` — Mock patches (excavate mode)

## Modes

| Mode | Behavior |
|------|----------|
| `survey` | Reports only, zero file changes |
| `excavate` | Reports + mock patches, zero file changes |
| `restore` | Apply approved changes, test-gated |

## Constraints

- NEVER commit directly to main or master
- NEVER remove or modify code without writing a site report first
- NEVER guess types; flag uncertain replacements for human review
- ALWAYS run tests between phases; stop immediately on failure
- ALWAYS revert changes if a phase introduces test failures
- NEVER consolidate types before dead code and legacy removal
- NEVER remove try/catch from I/O or external input boundaries

## Verification

Before claiming work is complete:

```bash
bash hooks/opencode/verify-phase.sh final_verify
bash -n hooks/opencode/*.sh
```

## Language Support

| Language | Dead Code | Dependencies | Types | DRY |
|----------|-----------|--------------|-------|-----|
| TypeScript | `knip` | `madge` | `tsc` | `jscpd` |
| JavaScript | `knip` | `madge` | N/A | `jscpd` |
| Python | `vulture` | `pydeps` | `mypy` | `pylint` |
| Go | `deadcode` | `godepgraph` | `go vet` | `golangci-lint` |
| Rust | `cargo-udeps` | `cargo-deps` | `rustc` | `clippy` |

If tools are missing, the skill falls back to AST-based manual analysis.

## Expedition Order

The expeditions MUST run in this fixed order:

1. Site Survey & Baseline
2. Dead Code Excavation
3. Legacy Stratum Removal
4. Circular Dependency Cartography
5. Type Catalog Consolidation
6. Type Restoration & Hardening
7. DRY Stratification
8. Error Handling Stratigraphy
9. Artifact Cleaning & Documentation
10. Site Preservation & Final Catalog
