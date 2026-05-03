# Code Archaeology Agent Guide

Code Archaeology is a multi-runtime plugin for systematic codebase excavation, cataloging, and restoration. It supports both **OpenCode** and **Hermes Agent** runtimes.

## Runtime Policy

- **OpenCode** is the primary interactive runtime (slash commands).
- **Hermes Agent** is the cron-based background runtime (one phase per 15-minute run).
- The plugin operates entirely within the target repository.
- All changes are isolated to a configurable branch (`refactor/archaeology` by default).

## Available Hooks

### OpenCode hooks (`hooks/opencode/`)
- `init.sh` — Initialize `.archaeology/` directory and session state
- `verify-phase.sh` — Run tests and typecheck between phases
- `revert-phase.sh` — Revert changes if a phase fails verification
- `update-expedition.sh` — Update expedition status in session.json

### Hermes hooks (`hooks/hermes/`)
- `setup.sh` — Detect Hermes capabilities and write `hermes-runtime.json`
- `runner.sh` — Execute one expedition phase per cron run with test gates

## Safety Hooks

- `verify-phase.sh` — Mandatory test/typecheck gate between expeditions (OpenCode)
- `revert-phase.sh` — Automatic rollback on failure (OpenCode)
- `runner.sh` — Built-in pre/post verification and auto-revert (Hermes)

## OpenCode Workflow

1. Run `hooks/opencode/init.sh` to initialize the session
2. For each expedition:
   a. Run the expedition (generate reports or apply changes)
   b. Run `hooks/opencode/verify-phase.sh <phase>` to verify
   c. If verification fails, run `hooks/opencode/revert-phase.sh <phase>`
   d. Run `hooks/opencode/update-expedition.sh <phase> <status> [findings]`
3. Final verification runs all checks and generates `FINAL_CATALOG.md`

## Hermes Workflow

1. Run `hooks/hermes/setup.sh` to detect Hermes capabilities
2. Create a Hermes cronjob (see `skills/hermes/INTEGRATION.md`)
3. Each cron run executes **exactly ONE** phase:
   a. Read `.archaeology/session.json` for current phase and mode
   b. Run the phase (survey, excavate, or restore)
   c. Run test/typecheck verification
   d. Keep or revert changes automatically
   e. Advance to next phase in `session.json`
   f. **STOP** — next cron run continues
4. After 10 phases, `FINAL_CATALOG.md` is generated

## Local State

`.archaeology/` is runtime state and must not be committed.

Key files:
- `session.json` — Expedition progress and configuration
- `site_survey.md` — Baseline inventory
- `expedition1-report.md` through `expedition8-report.md` — Per-expedition findings
- `FINAL_CATALOG.md` — Completed excavation summary
- `excavation_log.txt` — `git diff --stat`
- `patches/` — Mock patches (excavate mode)
- `hermes-runtime.json` — Hermes runtime configuration (Hermes only)

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

### OpenCode

Before claiming work is complete:

```bash
bash hooks/opencode/verify-phase.sh final_verify
bash -n hooks/opencode/*.sh
```

### Hermes

Verification is built into `runner.sh`:

```bash
bash hooks/hermes/runner.sh
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
