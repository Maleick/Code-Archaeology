# Code-Archaeology Expedition Report
**Expedition Date:** 2026-05-04
**Repository:** ~/Projects/Code-Archaeology
**Package:** opencode-code-archaeology v2.1.0
**Analysis Mode:** Survey (no changes made)

---

## Phase 0: Site Survey & Baseline

### Inventory
- **Source files (TypeScript):** 5 files (562 lines total)
- **Hook scripts (Bash):** 7 files
- **Expedition prompts:** 10 markdown files (prompts/)
- **Schema files:** Schema definitions in schema/
- **Config files:** package.json, tsconfig.json, .releaserc.json
- **Documentation:** README.md, AGENTS.md, INSTALL.md, docs/README.md, CHANGELOG.md
- **Total repo files:** ~70 across source, hooks, prompts, schema, docs, skills
- **Primary language:** TypeScript (source) + Markdown (prompts) + Bash (hooks)
- **Git contributors:** Maleick (8)
- **Git HEAD:** `335f04a` (ci: add semantic-release for automated npm publishing)
- **Git history:** 7 commits (young repo)

### Architecture
- **Thin TypeScript core:** The CLI (`src/cli.ts`) handles only `install`, `doctor`, `version`, `help`
- **Plugin entry:** `src/runtime.ts` — plugin registration for OpenCode
- **Types only:** `src/types.ts` (351 lines) — comprehensive type definitions for ArchaeologyConfig, Findings, Sessions, Reports
- **Prompt-driven analysis:** The real work is in prompts/ — 10 Markdown prompt files guide AI agents through expedition phases
- **Hook layer:** OpenCode hooks (init, verify, revert, update) and Hermes hooks (setup, runner)

### Dependency Health
- **Runtime dependencies:** None (package is a config/plugin tool)
- **Dev dependencies:** TypeScript, semantic-release (+ plugins), @types/node
- **Build system:** TypeScript compiler
- **Verification:** `npm test` (build + run tests), `npm run typecheck`, `npm run verify:pack`

### Baseline Metrics
- **Git history:** Young codebase — only 7 commits
- **Test framework:** Node.js built-in test runner (`--test`)
- **Test files:** In `tests/` directory (`.mjs` files)

---

## Phase 1: Dead Code Excavation

### Findings

| Category | File | Items | Confidence |
|----------|------|-------|------------|
| Unused export | src/runtime.ts | `packageRoot` — exported but may not be consumed externally | LOW |
| Unused export | src/runtime.ts | `repoRoot` — used internally only | LOW |
| Stub function | src/runtime.ts | `server()` — returns `{ event() { return undefined } }` — no-op stub | MEDIUM |
| Unused type | src/types.ts | `PluginServer` — only used in runtime.ts (1 ref) | LOW |
| Unused type | src/types.ts | `CliArgs` — defined but the CLI uses raw `process.argv` parsing | MEDIUM |
| Stale CLI option | src/cli.ts | `opencode-code-archaeology` only does install/doctor/version/help — compare to full plugin surface | LOW |

### Notable: PluginServer and server() Pattern
The `server()` function and `PluginServer` interface appear to be legacy from an older OpenCode plugin API shape. They produce a no-op event handler. If the new plugin API doesn't require this shape, they could be removed.

---

## Phase 2: Legacy Stratum Removal

### Findings

| Pattern | Location | Notes |
|---------|----------|-------|
| `unknown[]` cast | src/cli.ts:78-79 | `(skills as { paths?: unknown }).paths` — defensive casting |
| Process exit usage | src/cli.ts:106-116,133 | `process.exitCode = 1` pattern — acceptable for CLI |
| `function doctor()` | src/cli.ts:102-117 | Not async, but uses `existsSync` — synchronous path checks |
| Hardcoded paths | src/runtime.ts:31-35 | `commandFiles` array enumerates 4 command names |

### Recommendations
1. The `PluginServer` / `server()` stub is likely legacy from the OpenCode API V1 → V2 migration
2. `unknown[]` casting in CLI could be cleaned with a proper interface

---

## Phase 3: Circular Dependency Cartography

### Source Analysis

**Import Graph:**
```
src/plugin.ts → src/runtime.ts
src/runtime.ts → src/types.ts
src/cli.ts → no imports of internal modules (self-contained)
src/index.ts → src/runtime.ts
```

**Assessment:** ✅ No circular dependencies. Clean directed acyclic graph.

**Hook Layer:**
```
hooks/opencode/init.sh → standalone
hooks/opencode/verify-phase.sh → standalone
hooks/opencode/revert-phase.sh → standalone
hooks/opencode/update-expedition.sh → standalone
hooks/opencode/verify-package.sh → standalone (Node.js script)
hooks/hermes/setup.sh → standalone
hooks/hermes/runner.sh → standalone
```

**Assessment:** ✅ All hooks are self-contained with no dependencies on each other.

---

## Phase 4: Type Catalog Consolidation

### Findings

| Type Cluster | Files | Status |
|-------------|-------|--------|
| `ArchaeologyConfig` / `DEFAULT_CONFIG` | types.ts | Clean — DEFAULT_CONFIG provides defaults |
| `Finding` / `FindingCluster` | types.ts | Good separation — single items vs grouped |
| `Expedition` / `Session` | types.ts | Clear distinction |
| `SiteSurvey` | types.ts | Combines FileEntry[], DependencyEntry[], BaselineMetrics — good design |
| `FinalCatalog` | types.ts | Separate from Expedition report — correct semantics |

### Consolidation Opportunities
- No obvious type duplication — the type hierarchy is well-designed
- `DependencyEdge` / `DependencyCycle` could be merged with `DependencyEntry` possibly

---

## Phase 5: Type Restoration & Hardening

### Weak Type Scan

| Weak Type | Location | Risk | Recommendation |
|-----------|----------|------|----------------|
| `unknown[]` via `as` cast | cli.ts:78-79 | LOW | Defensive pattern for skills paths — acceptable |
| `unknown` in comparison | cli.ts:78 | LOW | `skills as { paths?: unknown }` — could be `string[]` |
| `unknown` handler | runtime.ts:18-22 | LOW | `server()` returns `undefined` — acceptable stub |
| Generic `Error` catch | cli.ts:132 | LOW | Standard CLI error handler |

### Assessment
- No `any` types in the codebase
- `unknown` used minimally and appropriately
- Type discipline is excellent for a young codebase

---

## Phase 6: DRY Stratification

### Duplicate Code Analysis

| Pattern | Locations | Severity | Recommendation |
|---------|-----------|----------|----------------|
| `packageRoot` resolution | runtime.ts:9, cli.ts:17 (via dirname(dirname(...))) | MEDIUM | Two different methods of resolving the root path |
| README tables | README.md (multiple large tables) | LOW | Acceptable for documentation |
| Command file enumeration | runtime.ts:31-35, runtime.ts:55 | LOW | Small array, acceptable duplication |
| REQUIRED_FILES | cli.ts:10-21 (for doctor) | LOW | Acceptable check list |

### Key Finding: Dual Root Resolution
- `runtime.ts:9`: `packageRoot = resolve(__dirname, "..")`
- `cli.ts:17`: `root = dirname(dirname(cliFile))`
- Both resolve to the same directory but use different techniques

---

## Phase 7: Error Handling Stratigraphy

### Anti-Pattern Scan

| Anti-Pattern | Location | Risk | Notes |
|--------------|----------|------|-------|
| `catch (error)` with generic handling | cli.ts:131-133 | LOW | Standard CLI error handler — acceptable |
| `try/catch` for file existence | cli.ts:67-70 | LOW | `existsSync` check + try/catch on read — standard pattern |
| Bare catch-all | cli.ts:43-45 | LOW | `catch { return {} }` — config loader fallback |

### Assessment
- Error handling is appropriate for a CLI tool
- No suppressed errors at I/O boundaries
- Try/catch blocks are at the correct boundaries (file I/O)

---

## Phase 8: Artifact Cleaning & Documentation

### Findings
- **10 expedition prompt files** — well-structured Markdown
- **Schema directory** with type schemas
- **Skills documentation** for both OpenCode and Hermes
- **AGENTS.md** — comprehensive agent runtime guide
- **No console.log in production code** (CLI only)
- **CHANGELOG.md** maintained

### Documentation Quality
- README.md is thorough with architecture diagrams (Mermaid)
- Safety model well documented
- Expedition order clearly defined
- Language support table is incomplete (only TypeScript/JavaScript tools listed)

---

## Phase 9: Final Catalog & Recommendations

### Executive Summary
Code-Archaeology v2.1.0 is a well-designed, young codebase (7 commits) with a unique architecture: the TypeScript layer handles plugin registration and CLI bootstrapping, while the real analysis logic lives in 10 Markdown prompt files that guide AI agents through expedition phases. The codebase is clean, well-typed, and has no circular dependencies.

### Key Strengths
1. **Clean architecture:** Thin TypeScript core + prompt-driven AI analysis
2. **Excellent type discipline:** Zero `any` types, minimal `unknown`
3. **No circular dependencies:** Clean import graph in both TypeScript and hooks
4. **Comprehensive documentation:** README, AGENTS.md, skills docs, prompts, schemas
5. **Thoughtful design:** Expedition order dependency chain, safety model with mode gating

### Refactoring Opportunities

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| MEDIUM | Remove `PluginServer` / `server()` stub if no longer needed | 15min | 25-line cleanup |
| MEDIUM | Consolidate root path resolution (runtime.ts vs cli.ts) | 10min | Consistent pattern |
| LOW | Add proper type for `skills` param instead of `unknown[]` cast | 15min | Better type safety |
| LOW | Make `CliArgs` type usable or remove it | 10min | Clean up types |
| LOW | Add tooling language support to README table | 5min | Completeness |

### Architecture Evolution
The codebase is too young to show significant evolution (7 commits), but the design choices suggest:
1. **V1.x → V2.x:** Migration from simple static analysis to prompt-driven AI analysis
2. **Monorepo structure:** Added Hermes runtime support, skills system, schema definitions
3. **Semantic release:** Recently added for automated npm publishing

### Recommended Future Directions
1. Add actual analysis tooling (knip, jscpd, madge, vulture, etc.) integration in the CLI
2. Consider implementing the analysis engines in TypeScript for hermetic operation
3. Expand language support beyond TypeScript/JavaScript
4. Add a `--quick` mode for fast surveys

---
*Report generated by Code Archaeology Survey mode. No source files were modified.*
