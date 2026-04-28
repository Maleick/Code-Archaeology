---
name: code-archaeology
description: Use when a codebase has accumulated technical debt including dead code, legacy fallbacks, circular dependencies, duplicate types, weak typing, defensive programming slop, or error handling anti-patterns that need systematic excavation and cataloging before restoration.
platform: opencode
tools: ["Bash", "Agent", "Read", "Write", "Edit", "Glob", "Grep", "Skill", "TaskCreate", "TaskUpdate"]
---

# Code Archaeology

Systematic excavation of a codebase to remove accumulated sediment—dead code, legacy fallbacks, circular dependencies, weak types, and defensive programming slop—while producing human-reviewable site reports before any artifacts are disturbed. Non-destructive by default.

## Overview

Code Archaeology treats a codebase like an archaeological site. Each expedition removes a specific class of technical debt in a fixed order (stratigraphic dependencies). Reports are generated at every phase. In `survey` mode, zero files are modified. In `excavate` mode, mock patches are produced for human review. In `restore` mode, approved changes are executed.

## When to Use

- Codebase has grown over years with unclear ownership
- Large amounts of commented-out, unused, or unreachable code exist
- Legacy polyfills, shims, or compatibility layers remain for EOL environments
- Circular dependencies block tree-shaking or slow builds
- Types are duplicated across files or use `any`/`unknown` excessively
- Error handling suppresses or swallows exceptions
- DRY violations create maintenance burden
- Team wants a full audit before refactoring

## When NOT to Use

- Greenfield project with minimal code
- Codebase already has active refactoring in progress
- No test suite exists (baseline verification requires passing tests)
- Team cannot review generated reports before restoration

## Expedition Order (Fixed)

The expeditions MUST run in this order due to stratigraphic dependencies:

1. **Site Survey & Baseline** — inventory, metrics, baseline capture
2. **Dead Code Excavation** — unused exports, unreachable functions, orphans
3. **Legacy Stratum Removal** — deprecated APIs, polyfills, shims
4. **Circular Dependency Cartography** — map and break cycles
5. **Type Catalog Consolidation** — deduplicate types
6. **Type Restoration & Hardening** — replace weak types
7. **DRY Stratification** — extract semantic duplications
8. **Error Handling Stratigraphy** — fix suppression/empty catch
9. **Artifact Cleaning & Documentation** — remove slop, update docs
10. **Site Preservation & Final Catalog** — verify, preserve records

**Why this order:** You cannot consolidate types before removing dead code (you might catalog code that should be discarded). You cannot DRY before untangling cycles (abstractions over cyclic deps create worse stratification).

## Modes

| Mode | File Changes | Reports | Use Case |
|------|-------------|---------|----------|
| `survey` | Zero | All | Initial audit, management review |
| `excavate` | Zero | All + mock patches | Pre-approval, team review |
| `restore` | Yes (HIGH confidence) | All | Executing approved changes |

With `strict_mode: true`, restore also applies MEDIUM confidence findings.

## Constraints

- NEVER commit directly to main or master
- NEVER remove or modify code without writing a site report first
- NEVER guess types; flag uncertain replacements for human review
- ALWAYS run tests between phases; stop immediately on failure
- ALWAYS revert changes if a phase introduces test failures
- NEVER consolidate types before dead code and legacy removal
- NEVER remove try/catch from I/O or external input boundaries

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `repo_path` | `.` | Target repository |
| `language` | `typescript` | Primary language |
| `mode` | `survey` | `survey`, `excavate`, or `restore` |
| `strict_mode` | `false` | Auto-restore medium-confidence findings |
| `test_command` | `npm test` | Test runner command |
| `typecheck_command` | `npx tsc --noEmit` | Type check command |
| `branch_name` | `refactor/archaeology` | Git branch to create |

## Language-Specific Tooling

| Language | Dead Code | Dependencies | Types | DRY |
|----------|-----------|--------------|-------|-----|
| TypeScript | `knip`, `unimported` | `madge` | `tsc` | `jscpd` |
| JavaScript | `knip`, `depcheck` | `madge` | N/A | `jscpd` |
| Python | `vulture` | `pydeps` | `mypy` | `pylint` |
| Go | `deadcode`, `staticcheck` | `godepgraph` | `go vet` | `golangci-lint` |
| Rust | `cargo-udeps`, `rustc` | `cargo-deps` | `rustc` | `clippy` |

If tools are missing, the skill falls back to AST-based manual analysis.

## Quick Reference

```bash
# Survey only (zero changes)
opencode run code-archaeology --mode survey

# Generate mock patches for review
opencode run code-archaeology --mode excavate

# Restore high-confidence findings
opencode run code-archaeology --mode restore

# Restore with medium confidence too
opencode run code-archaeology --mode restore --strict_mode true
```

## Output Artifacts

All artifacts are written to `.archaeology/`:

- `site_survey.md` — baseline inventory and stratum graph
- `expedition1-report.md` through `expedition8-report.md` — per-expedition findings
- `FINAL_CATALOG.md` — completed excavation metrics and recommendations
- `excavation_log.txt` — `git diff --stat`

## Expedition Prompts

Detailed instructions for each expedition are in the plugin's `prompts/` directory:

- `discovery.md` — Phase 0: Site Survey
- `dead_code.md` — Expedition 1
- `legacy.md` — Expedition 2
- `dependencies.md` — Expedition 3
- `types_consolidate.md` — Expedition 4
- `types_harden.md` — Expedition 5
- `dry.md` — Expedition 6
- `errors.md` — Expedition 7
- `polish.md` — Expedition 8
- `final_verify.md` — Phase 9

## Common Mistakes

- Running `restore` before reviewing `survey` reports — always review first
- Skipping test runs between phases — failures must be caught immediately
- Consolidating types before removing dead code — creates cataloging work for discarded code
- Removing I/O boundary try/catch blocks — these protect against external failures
- Guessing types during hardening — flag uncertain replacements for review instead
