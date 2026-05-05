# AutoResearch Expedition Report
**Expedition Date:** 2026-05-04
**Repository:** ~/Projects/AutoResearch
**Package:** opencode-autoresearch v3.3.4
**Analysis Mode:** Survey (no changes made)

---

## Phase 0: Site Survey & Baseline

### Inventory
- **Source files (TypeScript):** 8 files (5,227 lines total)
- **Test files:** 13 test files (3,566 lines total)
- **Hook scripts (Bash/sh):** 4 files
- **Config files:** package.json, tsconfig.json, jest.config.json, .opencode-plugin/plugin.json
- **Documentation:** AGENTS.md, README.md, INSTALL.md, docs/ARCHITECTURE.md, CHANGELOG.md
- **Total repo size:** 26,103 lines across all tracked files
- **Primary language:** TypeScript
- **Git contributors:** Maleick (94), Michael Miles (19)
- **Git HEAD:** `a3b6a3e` (chore: update coverage reports)

### Architecture
- **6 core modules:** `index.ts` (plugin entry), `cli.ts` (CLI dispatch), `helpers.ts` (utilities), `run-manager.ts` (state machine), `subagent-pool.ts` (role orchestration), `wizard.ts` (setup), `types.ts` (interfaces), `constants.ts` (constants)
- **State machine:** Runs/iterations with verify loops, supervisor snapshots
- **Subagent pool:** Dynamic role-based subagent orchestration with resource tiering
- **Dual runtime:** OpenCode (primary via commands/) + Hermes Agent (via hooks/hermes/)

### Dependency Health
- **Test framework:** Jest with `--experimental-vm-modules`
- **Build system:** TypeScript compiler
- **Verification:** `npm test`, `npm run typecheck`, `npm run verify:pack`
- **CI:** semantic-release for npm publishing with OIDC trusted publishing

---

## Phase 1: Dead Code Excavation

### Findings

| Category | File | Items | Confidence |
|----------|------|-------|------------|
| Unused export | src/wizard.ts | `buildSetupSummary` — only called from cli.ts (1 consumer) | LOW |
| Unused type | src/types.ts | `WizardConfig` — defined but only used in wizard.ts (1 consumer) | LOW |
| Potentially unused | src/helpers.ts | `resolveRepo` — only called from CLUI commands | LOW |
| Orphaned import | src/helpers.ts | `import { writeFileSync, ... } from "fs"` — some may not all be used in helpers | MEDIUM |

### Notes
- The codebase is tightly coupled by design — most exports are consumed
- No true dead code found; the TypeScript is lean and purpose-built
- The `AutoresearchError` class in helpers.ts is clean but could potentially be deduplicated

---

## Phase 2: Legacy Stratum Removal

### Findings

| Pattern | Location | Notes |
|---------|----------|-------|
| `fallback_mode: "serial"` | src/subagent-pool.ts:85 | Hardcoded fallback — could be configurable |
| `import { readFileSync } from 'fs'` pattern | hooks/*.sh | Inline Node.js script patterns in shell hooks — works but is unconventional |
| Empty catch blocks | src/helpers.ts:33-34 | `catch { /* ignore */ }` in atomicWriteText cleanup |
| `try { unlinkSync(tmp) } catch { /* ignore */ }` | src/helpers.ts:34 | Standard temp file cleanup pattern — acceptable |
| Dynamic import pattern | src/cli.ts | Heavy use of `await import(...)` — avoids circular deps but adds latency |

---

## Phase 3: Circular Dependency Cartography

### Source Analysis

**TypeScript Layer — Import Graph:**
```
index.ts → constants.ts, types.ts
cli.ts → helpers.ts, constants.ts, run-manager.ts, wizard.ts
helpers.ts → types.ts
run-manager.ts → types.ts, constants.ts, subagent-pool.ts, helpers.ts
wizard.ts → types.ts, subagent-pool.ts
subagent-pool.ts → (no internal imports, self-contained)
types.ts → (no internal imports)
constants.ts → (no internal imports)
```

**Assessment:** ✅ No circular dependencies in TypeScript layer. Clean directed acyclic graph.

**Hook Layer:**
```
hooks/init.sh → inline Node.js
hooks/status.sh → inline Node.js
hooks/stop.sh → inline Node.js
hooks/verify-package.sh → Node.js verification
```

**Assessment:** ✅ Hook scripts use inline Node.js, not shell functions — no dependency cycles.

---

## Phase 4: Type Catalog Consolidation

### Findings

| Type Cluster | Files | Status |
|-------------|-------|--------|
| `RunConfig` / `WizardConfig` | types.ts | `WizardConfig` is `Partial<Omit<RunConfig, 'baseline'>>` — clean inheritance |
| `RunState` / `SupervisorSnapshot` | types.ts | `SupervisorSnapshot` duplicates many fields from `RunState` + artifacts | 
| `Metric` | types.ts | Extends `Record<string, unknown>` — could be more precise |
| `LabelRequirements` / `ArtifactPaths` | types.ts | Minimal, only used in 2 places each |

### Recommendations
1. **Consolidate `SupervisorSnapshot`:** It duplicates ~10 fields from `RunState`. Consider `Pick<RunState, ...>` or derive the snapshot type
2. **`Metric extends Record<string, unknown>`:** Consider a stricter defined shape
3. **`WizardConfig`:** The `Partial<Omit<RunConfig, 'baseline'>>` approach is good — keep it

---

## Phase 5: Type Restoration & Hardening

### Weak Type Scan

| Weak Type | Location | Risk | Recommendation |
|-----------|----------|------|----------------|
| `payload: unknown` | helpers.ts:11,39 | LOW | Acceptable for JSON serialization |
| `values?: unknown` | helpers.ts:140 | MEDIUM | Could be `string[]` input |
| `value: unknown` | helpers.ts:187 | MEDIUM | `parseRunState` could use `Record<string, unknown>` |
| `val: unknown` | cli.ts:87 | LOW | Format function — acceptable |
| `Record<string, unknown>` | Various | LOW | Used for dynamic JSON — acceptable |
| `[key: string]: unknown` | interfaces | LOW | Acceptable for dynamic config |

### Assessment
- AutoResearch uses `unknown` appropriately where types are truly dynamic
- No `any` types found in source code — excellent type discipline
- The `unknown` usage is safe and intentional

---

## Phase 6: DRY Stratification

### Duplicate Code Analysis

| Pattern | Locations | Severity | Recommendation |
|---------|-----------|----------|----------------|
| `import { readFileSync } from "fs"` + inline JS | hooks/*.sh (init, status, stop) | MEDIUM | All 3 hooks embed identical Node.js script patterns |
| `readJsonFile` pattern | hooks/*.sh | MEDIUM | Inline JSON reading in shell hooks duplicates `helpers.ts:readJsonFile` |
| `parseTsvFile` / `countTsvDataRows` | helpers.ts | LOW | These are specialized and used distinctly |
| Iteration append logic | run-manager.ts:44-131 | MEDIUM | Long function doing multiple things — consider splitting |

### Key Finding: Hook Inline Node.js Pattern
Three shell hooks (init.sh, status.sh, stop.sh) embed inline Node.js scripts that:
1. Import `readFileSync` from 'fs'
2. Read a JSON state file
3. Do some operation
This pattern is repeated 3 times with slight variations. Could be a shared .mjs helper.

---

## Phase 7: Error Handling Stratigraphy

### Anti-Pattern Scan

| Anti-Pattern | Location | Risk | Notes |
|--------------|----------|------|-------|
| Empty catch | helpers.ts:34 | LOW | `catch { /* ignore */ }` — temp file cleanup |
| Bare try/catch | helpers.ts:46 | LOW | `catch (err)` → `throw new AutoresearchError(...)` — properly wrapped |
| `|| true` silencing | cli.ts | LOW | Some optional operations silenced |
| Generic catch | cli.ts (various) | LOW | `catch` without specific error type — all in CLI handlers |
| Silent catch | helpers.ts:43-51 | MEDIUM | `readJsonFile` wraps all errors generically — loses original error context |

### Assessment
- Error handling is generally good — errors are wrapped in `AutoresearchError`
- CLI error messages are user-friendly
- No error suppression at internal boundaries

---

## Phase 8: Artifact Cleaning & Documentation

### Findings
- **13 test files** with good coverage (unit + integration)
- **CHANGELOG.md** maintained
- **AUTORESEARCH_FINDINGS.md** — systematic review document
- **ARCHITECTURE.md** — detailed architecture documentation
- No commented-out code detected
- Shell hooks are dual #!/bin/sh and #!/usr/bin/env bash — could standardize

---

## Phase 9: Final Catalog & Recommendations

### Executive Summary
AutoResearch is a mature (v3.3.4, ~100 commits) self-improvement engine with clean TypeScript architecture. The codebase has strong type discipline (zero `any` types), good test coverage (3,566 lines of tests), and clear module boundaries.

### Key Strengths
1. **Clean import graph:** Zero circular dependencies
2. **Excellent typing:** No `any` types, appropriate use of `unknown`
3. **Good test coverage:** 13 test files covering CLI, helpers, state, subagent pool, edge cases
4. **Clear architecture:** Module boundaries are well-defined
5. **Self-improvement loop:** The codebase has been refined through automated iterations

### Refactoring Opportunities

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| HIGH | Consolidate `SupervisorSnapshot` — derive from `RunState` | 1h | Reduces type duplication |
| MEDIUM | Extract shared Node.js helper for shell hooks (init/status/stop) | 1h | DRY shell hooks |
| MEDIUM | Better error context in `readJsonFile` | 30min | Improves debuggability |
| LOW | `Metric extends Record<string, unknown>` → stricter shape | 30min | Better type safety |
| LOW | Standardize hook shebangs (#!/bin/sh vs #!/usr/bin/env bash) | 15min | Consistency |

### Architecture Evolution
- Initial release v3.3.0 → v3.3.4 with semantic-release
- Added Hermes Agent runtime support
- Self-improvement loop refined through 20+ iterations
- Subagent pool with dynamic role orchestration
- Model routing with free-tier priority

---
*Report generated by Code Archaeology Survey mode. No source files were modified.*
