---
name: code-archaeology-hermes
description: Code Archaeology expedition runner for Hermes Agent — systematic codebase excavation with test-gated phases.
trigger: When running Code Archaeology on Hermes Agent via cronjob.
---

# Code Archaeology Hermes Skill

## One Phase Per Cron Run

Each cron run executes exactly ONE expedition phase. Do not combine phases.

## Phase Detection (run FIRST)

```bash
cd {{workdir}}
if [ -f .archaeology/session.json ]; then
  phase=$(jq -r '.current_phase' .archaeology/session.json)
  mode=$(jq -r '.mode' .archaeology/session.json)
  status=$(jq -r '.status' .archaeology/session.json)
else
  phase="site-survey"
  mode="survey"
  status="running"
fi
```

**Decision tree:**
- `status` = "complete" → **STOP** (all phases done)
- `status` = "blocked" → **STOP** (report blocker)
- `phase` = "site-survey" → **Phase 1**
- `phase` = "dead-code" → **Phase 2**
- `phase` = "legacy-removal" → **Phase 3**
- `phase` = "dependency-mapping" → **Phase 4**
- `phase` = "type-consolidation" → **Phase 5**
- `phase` = "type-hardening" → **Phase 6**
- `phase` = "dry-stratification" → **Phase 7**
- `phase` = "error-handling" → **Phase 8**
- `phase` = "artifact-cleaning" → **Phase 9**
- `phase` = "final-catalog" → **Phase 10**

## Expedition Phases

### Phase 1: Site Survey & Baseline

1. Create `.archaeology/` directory if missing
2. Generate `site_survey.md` — baseline inventory of codebase
3. Record: file count, language distribution, test coverage, dependencies
4. **No code changes**

**STOP after survey.** Next run: Phase 2.

### Phase 2: Dead Code Excavation

1. Catalog dead code, unused exports, unreachable functions
2. Generate `expedition2-report.md` with findings
3. **Mode = survey**: reports only
4. **Mode = restore**: remove dead code (test-gated)

**STOP after catalog.** Next run: Phase 3.

### Phase 3: Legacy Stratum Removal

1. Identify legacy fallbacks, deprecated shims, compatibility layers
2. Generate `expedition3-report.md`
3. **Never remove try/catch from I/O boundaries**
4. **Mode = restore**: remove approved legacy code (test-gated)

**STOP after identification.** Next run: Phase 4.

### Phase 4: Circular Dependency Cartography

1. Map circular dependencies using language-specific tools
2. Generate `expedition4-report.md` with dependency graph
3. **No code changes** (mapping only)

**STOP after mapping.** Next run: Phase 5.

### Phase 5: Type Catalog Consolidation

1. Find duplicate type definitions
2. Generate `expedition5-report.md`
3. **Only run AFTER dead code and legacy removal**
4. **Mode = restore**: consolidate types (test-gated)

**STOP after catalog.** Next run: Phase 6.

### Phase 6: Type Restoration & Hardening

1. Identify weak types without guessing replacements
2. Generate `expedition6-report.md`
3. Flag uncertain replacements for human review
4. **Mode = restore**: harden approved types (test-gated)

**STOP after identification.** Next run: Phase 7.

### Phase 7: DRY Stratification

1. Find semantic duplication and error-handling slop
2. Generate `expedition7-report.md`
3. **Preserve I/O boundaries**
4. **Mode = restore**: DRY approved code (test-gated)

**STOP after analysis.** Next run: Phase 8.

### Phase 8: Error Handling Stratigraphy

1. Review error-handling patterns
2. Generate `expedition8-report.md`
3. **Never remove try/catch from I/O or external input boundaries**
4. **Mode = restore**: improve approved error handling (test-gated)

**STOP after review.** Next run: Phase 9.

### Phase 9: Artifact Cleaning & Documentation

1. Identify stale artifacts and documentation gaps
2. Generate `expedition9-report.md`
3. Clean approved artifacts (test-gated)

**STOP after cleaning.** Next run: Phase 10.

### Phase 10: Site Preservation & Final Catalog

1. Generate `FINAL_CATALOG.md` — complete excavation summary
2. Run final verification (all tests + typecheck)
3. Update session.json: `status = "complete"`

**STOP. Expedition complete.**

## Verification (between phases)

```bash
# Pre-phase: ensure clean state
{{test_command}}
{{typecheck_command}}

# Post-phase (restore mode only): verify changes
{{test_command}}
{{typecheck_command}}
```

**If verification fails:**
1. Revert changes: `git reset --hard HEAD`
2. Update session: `status = "blocked"`, `blocked_reason = "..."`
3. Report blocker and STOP

## Mode Behavior

| Mode | Action | File Changes? |
|------|--------|---------------|
| **survey** | Generate reports only | None outside `.archaeology/` |
| **excavate** | Reports + mock patches | None outside `.archaeology/patches/` |
| **restore** | Apply approved changes | Yes, test-gated |

## Rules

- **One phase per cron run** — never combine
- **Fixed order** — never skip phases
- **Survey first** — always generate reports before changes
- **Test gates** — run tests between every phase
- **Auto-revert** — revert on any verification failure
- **Preserve I/O** — never remove try/catch from boundaries
- **No guessing** — flag uncertain types for human review
- **Use [SILENT]** for no-op phases

## Context Variables

| Variable | Source |
|----------|--------|
| `{{workdir}}` | Cronjob `workdir` setting |
| `{{mode}}` | session.json (survey/excavate/restore) |
| `{{test_command}}` | session.json |
| `{{typecheck_command}}` | session.json |
| `{{branch_name}}` | session.json (default: refactor/archaeology) |
| `{{language}}` | session.json (default: typescript) |

## Language Tool Mapping

| Language | Dead Code | Dependencies | Types | DRY |
|----------|-----------|--------------|-------|-----|
| TypeScript | `knip` | `madge` | `tsc` | `jscpd` |
| JavaScript | `knip` | `madge` | N/A | `jscpd` |
| Python | `vulture` | `pydeps` | `mypy` | `pylint` |
| Go | `deadcode` | `godepgraph` | `go vet` | `golangci-lint` |
| Rust | `cargo-udeps` | `cargo-deps` | `rustc` | `clippy` |

## STOP Conditions

- All 10 phases complete
- Verification fails (blocked)
- `stop_requested` flag set
- Human review required (strict mode findings)

## Next Steps After Complete

1. Review `.archaeology/FINAL_CATALOG.md`
2. Review all `expedition*-report.md` files
3. Apply mock patches from `.archaeology/patches/` if in excavate mode
4. Merge `refactor/archaeology` branch if in restore mode
5. Archive `.archaeology/` directory

**Start by detecting phase from session.json. Execute exactly ONE phase with verification. STOP.**
