# Code Archaeology Architecture

Code Archaeology is a multi-runtime plugin that operates entirely inside the target repository. It coordinates slash commands (OpenCode), native skills (Codex), cron-based execution (Hermes), shell hooks, prompts, schemas, and local `.archaeology/` artifacts to run a fixed excavation workflow.

## Repository Layout

```text
Code-Archaeology/
|-- assets/             # README and repository visual assets
|-- commands/           # OpenCode slash command definitions
|-- dist/               # Built package output for GitHub-based installs
|-- docs/               # Public documentation and release notes
|-- hooks/opencode/     # Init, verification, revert, and status hooks
|-- hooks/hermes/       # Setup and runner hooks for Hermes Agent
|-- plugins/            # Repo-local legacy plugin shim
|-- prompts/            # Expedition prompts by phase
|-- schema/             # JSON schemas for reports
|-- skills/             # Code Archaeology skill definitions
|   |-- code-archaeology/   # OpenCode skill
|   |-- codex/              # Codex skill
|   `-- hermes/             # Hermes Agent skill and integration docs
|-- src/                # TypeScript package and CLI source
|-- wiki/               # Source pages for GitHub Wiki publication
|-- INSTALL.md          # Root install handoff
|-- README.md           # Public project overview
|-- AGENTS.md           # Agent runtime guide
```

## Runtime Surfaces

### OpenCode Plugin Surfaces

- `dist/index.js` and the `./plugin` package export expose the plugin entry point consumed by OpenCode. `plugins/` is a repo-local legacy shim and is not included in npm package contents.
- `commands/` defines the slash command family: `/code-archaeology`, `/code-archaeology-survey`, `/code-archaeology-excavate`, and `/code-archaeology-restore`. The default `/code-archaeology` command runs the full survey chain without per-phase prompts and remains non-destructive.
- `skills/code-archaeology/` contains the domain workflow instructions agents follow during an expedition.
- `hooks/opencode/` provides shell gates for session setup, verification, rollback, and status updates.
- `prompts/` and `schema/` provide phase-specific guidance and artifact structure.
- `src/` builds the npm package and CLI used by `opencode-code-archaeology install`, `doctor`, and `version`.

### Hermes Agent Surfaces

- `hooks/hermes/setup.sh` detects Hermes capabilities and writes `hermes-runtime.json`.
- `hooks/hermes/runner.sh` executes one expedition phase per cron run with built-in verification.
- `skills/hermes/` contains the Hermes-specific skill prompt, integration guide, and README.
- Hermes uses the same `.archaeology/session.json` state file as OpenCode.

### Codex Surfaces

- `skills/codex/SKILL.md` contains Codex-native workflow instructions and trigger metadata.
- `opencode-code-archaeology install-codex` copies that skill to `$CODEX_HOME/skills/code-archaeology/SKILL.md`.
- Codex uses the same `.archaeology/` artifacts and report-first expedition order as OpenCode.

## Commands, Skills, And Hooks

Commands are the user-facing entry points. `/code-archaeology` selects survey mode by default and runs all 10 phases to produce reports. The explicit restore command is required before source files are changed.

The Code Archaeology skill defines the expedition order, safety constraints, language-tool preferences, and reporting expectations. It is the agent-facing control layer that prevents phases from running out of order.

Hooks are the shell-level enforcement layer:

### OpenCode hooks
- `init.sh` initializes `.archaeology/` and session state.
- `verify-phase.sh <phase>` runs configured tests and type checks between phases.
- `revert-phase.sh <phase>` reverts changes when a restore phase fails verification.
- `update-expedition.sh <phase> <status> [findings]` updates session progress.

### Hermes hooks
- `setup.sh` detects Hermes CLI / active session and writes runtime config.
- `runner.sh` reads session state, executes one phase, verifies, and advances.

## Expedition Flow

The phase order is fixed because later cleanup depends on earlier evidence:

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

`survey` mode writes reports only. `excavate` mode writes reports plus mock patches. `restore` mode applies approved changes and must pass verification between phases. `yolo` mode applies the same restore sequence with `strict_mode` enabled and no manual review handoff.

## Runtime Comparison

| Feature | OpenCode | Codex | Hermes |
|---------|----------|-------|--------|
| Entry | `/code-archaeology` slash command | `code-archaeology` skill | `cronjob` |
| Phases | All in one session | All in one session | One per cron run |
| Verification | Between expeditions | Before/after editing phases | Between every phase |
| Revert | Manual or automatic | Manual or automatic per Codex workflow | Automatic on failure |
| State | `.archaeology/session.json` | Same file | Same file |
| Background | Plugin stays active | Interactive session | Cron resumes automatically |
| Real-time | Yes | Yes | Delayed (15-min intervals) |

## Artifact Lifecycle

Runtime artifacts live in `.archaeology/` inside the target repository:

| Artifact | Purpose |
| --- | --- |
| `session.json` | Current expedition progress and configuration. |
| `site_survey.md` | Baseline inventory and site report. |
| `expedition1-report.md` through `expedition8-report.md` | Per-expedition findings. |
| `FINAL_CATALOG.md` | Final excavation summary and recommendations. |
| `excavation_log.txt` | `git diff --stat` for applied restoration work. |
| `patches/` | Mock patches generated by `excavate` mode. |
| `hermes-runtime.json` | Hermes runtime configuration (Hermes only). |

`.archaeology/` is ignored local state and should not be committed.

## Safety Gates

- Default to `survey` mode for reports only.
- Write a site report before removing or modifying code.
- Never consolidate types before dead code and legacy removal.
- Never remove try/catch blocks from I/O or external input boundaries automatically.
- Flag uncertain type replacements for human review instead of guessing.
- Run `verify-phase.sh` between restore phases (OpenCode).
- Run built-in verification in `runner.sh` between phases (Hermes).
- Run `revert-phase.sh` and stop if a phase introduces test failures.
- Keep restore work isolated to the configured branch, `refactor/archaeology` by default.

## Local State

The plugin keeps operational state in the target repository, not in a remote service. This makes expeditions reviewable and reproducible, but maintainers must keep `.archaeology/` out of commits and inspect generated reports before applying restore changes.
