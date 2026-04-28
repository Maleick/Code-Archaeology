---
name: code-archaeology
description: Start a Code Archaeology expedition to excavate, catalog, and restore a codebase by removing technical debt systematically
trigger:
  - "start archaeology"
  - "run archaeology"
  - "code archaeology"
  - "/archaeology"
  - "/code-archaeology"
---

# Code Archaeology — Systematic Codebase Excavation

Excavate, catalog, and restore a codebase by removing accumulated sediment: dead code, legacy fallbacks, circular dependencies, weak types, and defensive programming slop. Produces human-reviewable site reports before any artifacts are disturbed. Non-destructive by default.

## Quick Start

```
Run: /code-archaeology
```

## What It Does

1. **Surveys** the codebase — inventory, metrics, baseline
2. **Excavates** dead code — unused exports, unreachable functions
3. **Removes** legacy stratum — deprecated APIs, polyfills, shims
4. **Maps** circular dependencies — cartography and remediation
5. **Consolidates** types — deduplicate type definitions
6. **Hardens** types — replace `any`/`unknown` with precise types
7. **Enforces** DRY — extract semantic duplications
8. **Fixes** error handling — remove suppression, add proper handling
9. **Cleans** artifacts — documentation, formatting, remaining slop
10. **Preserves** the site — final verification and catalog

## Available Commands

| Command | Description |
|---------|-------------|
| `/code-archaeology` | Start full expedition (default: survey mode) |
| `/code-archaeology-survey` | Site survey only — zero file changes |
| `/code-archaeology-excavate` | Generate reports + mock patches for review |
| `/code-archaeology-restore` | Execute approved changes after review |

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

## Requirements

- Git repo with clean working tree
- Passing test suite (even if minimal)
- Type checker / linter installed
- `opencode` CLI available

## Safety

- **Survey mode (default)**: Zero file changes. Only reports generated.
- **Excavate mode**: Mock patches for human review. No actual modifications.
- **Restore mode**: Applies approved changes. Always runs tests between phases.
- **Branch isolation**: All work happens on `refactor/archaeology` (configurable).
- **Test gating**: Any phase that breaks tests is automatically reverted.

## Output Artifacts

All artifacts are written to `.archaeology/`:

- `site_survey.md` — baseline inventory and stratum graph
- `expedition1-report.md` through `expedition8-report.md` — per-expedition findings
- `FINAL_CATALOG.md` — completed excavation metrics and recommendations
- `excavation_log.txt` — `git diff --stat`

## Expedition Order (Fixed)

The expeditions MUST run in this order due to stratigraphic dependencies:

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

## Language Support

| Language | Dead Code | Dependencies | Types | DRY |
|----------|-----------|--------------|-------|-----|
| TypeScript | `knip` | `madge` | `tsc` | `jscpd` |
| JavaScript | `knip` | `madge` | N/A | `jscpd` |
| Python | `vulture` | `pydeps` | `mypy` | `pylint` |
| Go | `deadcode` | `godepgraph` | `go vet` | `golangci-lint` |
| Rust | `cargo-udeps` | `cargo-deps` | `rustc` | `clippy` |

If tools are missing, falls back to AST-based manual analysis.
