# AutoShip Expedition Report
**Expedition Date:** 2026-05-04
**Repository:** ~/Projects/AutoShip
**Package:** opencode-autoship v2.2.1
**Analysis Mode:** Survey (no changes made)

---

## Phase 0: Site Survey & Baseline

### Inventory
- **Source files (TypeScript):** 3 (21,950 lines total across all `*.ts` files excluding node_modules/dist)
- **Hook scripts (Bash):** ~40+ shell scripts (2,239 sh files in repo including test fixtures)
- **Config files:** package.json, tsconfig.json, policies/, various JSON
- **Documentation:** AGENTS.md, README.md, INSTALL.md, commands/ (Markdown)
- **Total repo files:** 4,408 (excluding node_modules)
- **Primary language:** TypeScript (src/) + Bash (hooks/)

### Dependency Health
- **Runtime dependencies:** semantic-release ecosystem
- **Dev dependencies:** TypeScript, various semantic-release plugins
- **Build system:** TypeScript compiler (`tsc`)
- **Git HEAD:** `935e928` (docs: update SKILL.md)

### Architecture
- **Thin TypeScript core:** 3 source files (cli.ts, types.ts, index.ts) — the CLI `opencode-autoship` handles install/doctor/help
- **Heavy hook layer:** ~60+ shell scripts orchestrate the entire issue-to-PR pipeline
- **Hermes integration:** 10+ scripts in `hooks/hermes/` for background runtime
- **Dual runtime:** OpenCode (primary) + Hermes Agent (cron-based secondary)

### Baseline Metrics
- **Test mechanism:** `npm test` → builds + runs test suite
- **TypeScript checks:** yes (tsc --noEmit via smoke-test.sh)
- **Shell script count:** ~60+ in hooks/opencode/ + hooks/hermes/

---

## Phase 1: Dead Code Excavation

### Findings

| Category | File | Items | Confidence |
|----------|------|-------|------------|
| Unused export | src/types.ts | `PluginServer` interface — only used in src/index.ts (1 reference) | LOW |
| Unused export | src/types.ts | `AutoshipConfig` — defined but consumed by shell scripts, not TypeScript | LOW |
| Unused type | src/types.ts | `Stats` interface — may be unused, defined for state.json structure | MEDIUM |
| Stale export | src/index.ts | `export * from "./types.js"` — re-exports all types, some may not be needed | LOW |
| Test fixture | hooks/opencode/test-fixtures/ | Mock data files only used by test-policy.sh | LOW |

### Notes
- The TypeScript layer is intentionally minimal — types serve as documentation for the JSON state files consumed by shell scripts
- No true dead code identified in TypeScript source; the real "code" is in the Bash hooks
- Some Bash hook scripts may be orphaned (e.g., old test fixtures)

---

## Phase 2: Legacy Stratum Removal

### Findings

| Pattern | Location | Notes |
|---------|----------|-------|
| Legacy field aliases | src/types.ts:196,200,204 | `max_concurrent_agents`, `max_retries`, `stall_timeout_ms` exist as legacy camelCase->snake_case aliases |
| Legacy model config | src/types.ts:306 | `plannerModel`, `coordinatorModel` fields marked "legacy, prefer model-routing.json" |
| Fallback chains | hooks/lib/common.sh:32 | Multi-tier config value fallback |
| Inline fallback | hooks/monitor-issues.sh, etc. | "Load shared utilities if available; inline fallback for standalone/test use" pattern in many hooks |
| macOS compat workarounds | hooks/opencode/process-event-queue.sh:60-65 | `lockf` vs `flock` handling for macOS |
| `flock` skip | hooks/opencode/monitor-agents.sh:58 | Conditional skip of flock on macOS |
| Compatibility-only markers | hooks/opencode/test-policy.sh:42-51 | Commands/skills marked "compatibility-only" |
| Fallback model | config/model-routing.json | Hardcoded fallback model reference |

### Recommendations
1. Remove legacy type aliases (max_concurrent_agents, max_retries, stall_timeout_ms) — they're documented as legacy
2. Remove plannerModel/coordinatorModel fields in favor of model-routing.json
3. Standardize the "inline fallback" pattern — extract to a shared utility
4. The macOS lockf/flock workarounds are necessary for portability

---

## Phase 3: Circular Dependency Cartography

### Source Analysis
- **TypeScript layer:** No circular dependencies — 3 files with simple import chain: `cli.ts → types.ts`, `index.ts → types.ts`
- **Bash hook layer:** Complex dependency graph with shared libs:
  - `hooks/lib/common.sh` ← `hooks/lib/test-fixtures.sh`
  - `hooks/opencode/lib/common.sh` — parallel copy of lib/common.sh
  - `hooks/update-state.sh` ← multiple hooks (dispatch, runner, reconcile)
  - `hooks/opencode/select-model.sh` ← dispatch, reviewer, runner

### Identified Issues
1. **Duplicate lib/common.sh:** `hooks/opencode/lib/common.sh` and `hooks/lib/common.sh` appear to be copies — risk of drift
2. **Complex hook interdependence:** `reconcile-state.sh` → `update-state.sh` → many other hooks creates implicit cycles
3. **Shared state through files:** All hooks communicate via `.autoship/state.json` files — correct by design but dependency invisible to static analysis

---

## Phase 4: Type Catalog Consolidation

### Findings
- **Types.ts (461 lines):** Comprehensive type definitions covering all JSON structures
- **Re-export pattern:** `index.ts` does `export * from "./types.js"` which re-exports everything
- **PluginServer interface:** Only used internally, could be made non-exported
- **QuotaFile interface:** Wraps a single `opencode: QuotaEntry` — may be over-engineered

### Recommendations
1. Consider making `PluginServer` a non-exported type
2. `QuotaFile` could be flattened to just `Record<string, QuotaEntry>` 
3. The legacy alias types should be removed as part of Expedition 2

---

## Phase 5: Type Restoration & Hardening

### Weak Type Scan

| Weak Type | Location | Risk | Recommendation |
|-----------|----------|------|----------------|
| `[key: string]: unknown` | src/cli.ts:24 | LOW — generic config type | Acceptable for dynamic config |
| `unknown` casts | src/cli.ts:78-79 | LOW — skills type assertion | Could use proper OpenCodeConfig type |
| String literals | src/types.ts:267 | LOW — `Record<AgentRole, string>` | Model IDs should be typed |
| `string` for timestamps | Throughout types.ts | LOW | ISO-8601 string is acceptable |

### Assessment
- AutoShip TypeScript layer uses types well — no `any` annotations
- The heavy lifting is in Bash where types don't apply
- No urgent hardening needed

---

## Phase 6: DRY Stratification

### Duplicate Code

| Pattern | Locations | Severity | Recommendation |
|---------|-----------|----------|----------------|
| `hooks/lib/common.sh` vs `hooks/opencode/lib/common.sh` | 2 copies | HIGH | Consolidate into one shared lib |
| "Load shared utilities if available; inline fallback" preamble | ~10 hooks | MEDIUM | Extract to a single shared loader |
| `git rev-parse --show-toplevel` logic | ~30 scripts | MEDIUM | Same pattern repeated across hooks |
| Config resolution pattern | monitor-issues.sh, monitor-prs.sh, process-event-queue.sh | MEDIUM | Extract to a shared config loader |
| `SCRIPT_DIR` detection | ~20 hooks | LOW | Standard boilerplate, acceptable |
| State lock/unlock pattern | update-state.sh, process-event-queue.sh | MEDIUM | Could be extracted |

---

## Phase 7: Error Handling Stratigraphy

### Findings

| Anti-Pattern | Location | Risk | Notes |
|--------------|----------|------|-------|
| Empty catch blocks | hooks/lib/test-fixtures.sh:79 | LOW | `eval` used in test context |
| Silenced errors | hooks/opencode/select-model.sh | MEDIUM | Piped commands with `|| true` |
| Silent `find -exec` | hooks/hermes/runner.sh:155-156 | MEDIUM | `2>/dev/null || true` swallows errors |
| Implicit error handling | ~20 hooks | LOW | `set -e` handles exit codes |
| `ignore` stdio | src/cli.ts:39 | LOW | Intentional — fallback behavior |

### Assessment
- AutoShip uses `set -euo pipefail` consistently in shell scripts — good practice
- Some error swallowing is intentional (e.g., `|| true` for optional operations)
- No critical error-handling issues found

---

## Phase 8: Artifact Cleaning & Documentation

### Findings
- **Console.log usage:** 19 instances in cli.ts — all appropriate (CLI output)
- **console.warn:** 1 instance (missing file warning)
- **console.error:** 1 instance (error handler)
- **No commented-out code** detected in TypeScript source
- **README.md** and docs are well-maintained

---

## Phase 9: Final Catalog & Recommendations

### Executive Summary
AutoShip is a well-structured GitHub issue-to-PR orchestration plugin with a thin TypeScript core and a comprehensive Bash hook layer. The real complexity lives in the ~60 shell scripts that handle planning, dispatching, monitoring, and PR creation.

### Key Findings
1. **Duplicate lib/common.sh:** Two copies of shared library code at `hooks/lib/common.sh` and `hooks/opencode/lib/common.sh` — consolidation needed
2. **Legacy type aliases:** Remove `max_concurrent_agents`, `max_retries`, `stall_timeout_ms` fields
3. **Inline fallback pattern:** ~10 hooks repeat the same "load shared if available" pattern
4. **git rev-parse boilerplate:** ~30 hooks repeat the same root detection
5. **macOS portability:** Workarounds for lockf/flock are necessary but create complexity

### Refactoring Opportunities
| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| HIGH | Consolidate duplicate lib/common.sh | 1h | Reduces drift risk |
| HIGH | Extract shared config loader | 2h | Removes boilerplate from ~10 hooks |
| MEDIUM | Remove legacy type aliases | 30min | Cleans up types |
| MEDIUM | Standardize `git rev-parse` in a shared function | 2h | DRY ~30 scripts |
| LOW | Remove PlannerModel/coordinatorModel fields | 15min | Deduplicate config |

### Architecture Evolution
- Initial TypeScript-only CLI with type definitions
- Grew into complex Bash hook orchestration layer
- Added Hermes Agent as secondary runtime (hooks/hermes/)
- Model routing moved from hardcoded config to `model-routing.json`
- Policy-based configuration added (policies/)

---
*Report generated by Code Archaeology Survey mode. No source files were modified.*
