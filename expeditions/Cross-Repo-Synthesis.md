# Multi-Repo Archaeological Synthesis
**Expedition Date:** 2026-05-04
**Repos Analyzed:** AutoShip (v2.2.1), AutoResearch (v3.3.4), Code-Archaeology (v2.1.0)
**Analysis Mode:** Survey (no changes made)

---

## Overview

Three interconnected OpenCode/Hermes Agent ecosystem projects developed by Maleick. Together they form a toolchain for:
1. **AutoShip** — Automated GitHub issue → PR orchestration
2. **AutoResearch** — Autonomous recursive self-improvement engine
3. **Code-Archaeology** — Systematic codebase excavation and cleanup

---

## Architectural Patterns Across Repos

### Pattern 1: Thin TypeScript Core + Bash Heavy Lifting
All three repos use TypeScript for type definitions, CLI entry points, and plugin registration, while delegating orchestration logic to Bash shell scripts.

| Repo | TypeScript LOC | Shell Scripts | Ratio |
|------|---------------|---------------|-------|
| AutoShip | 870 (3 files) | ~60 hooks | 1:20 |
| AutoResearch | 5,227 (8 files) | 4 hooks | 13:1 |
| Code-Archaeology | 562 (5 files) | 7 hooks | 1:1.3 |

**Finding:** AutoShip is the most shell-script-heavy, AutoResearch is the most TypeScript-heavy. Code-Archaeology is balanced.

### Pattern 2: Dual-Runtime Design
All three repos support both OpenCode (interactive slash commands) and Hermes Agent (cron-based background execution).

| Repo | OpenCode Hooks | Hermes Hooks | Pattern |
|------|---------------|--------------|---------|
| AutoShip | ~50+ | ~10 | Wraps opencode hooks with hermes versions |
| AutoResearch | 3 (shared) | 0 (same scripts) | Shared hooks work for both |
| Code-Archaeology | 5 | 2 | Separate but mirrored |

**Finding:** AutoResearch's shared-hook approach is most maintainable. AutoShip's duplicated hook sets for OpenCode vs Hermes could drift.

### Pattern 3: JSON-Based State Management
All repos use JSON files for persistent runtime state:

| Repo | State Dir | Key Files |
|------|-----------|-----------|
| AutoShip | `.autoship/` | state.json, model-routing.json, config.json, token-ledger.json |
| AutoResearch | `.autoresearch/` | state.json, launch.json |
| Code-Archaeology | `.archaeology/` | session.json, site_survey.md, expedition reports |

**Finding:** The JSON-based state pattern is consistent and well-designed. AutoShip has the most complex state with events, quotas, token ledgers, and failure artifacts.

### Pattern 4: Prompt-Driven AI Analysis
Code-Archaeology uniquely uses Markdown prompt files to guide AI agents through analysis phases. This is an innovative pattern that separates "what to do" (prompts) from "how to run it" (hooks/CLI).

---

## Cross-Repo Dead Code / Tech Debt

### Duplicate Patterns
- **AutoShip** has duplicate `lib/common.sh` files
- **AutoResearch** has the inline Node.js pattern duplicated across 3 hooks
- **Code-Archaeology** has dual root resolution paths

### Legacy Patterns
- **AutoShip** maintains legacy alias fields (`max_retries`, `stall_timeout_ms`, etc.)
- **Code-Archaeology** has a legacy `PluginServer` / `server()` stub
- **AutoResearch** has a hardcoded fallback mode in subagent-pool.ts

### Type Weaknesses
- **AutoShip:** Uses `Record<string, unknown>` extensively (acceptable for dynamic config)
- **AutoResearch:** Uses `unknown` appropriately, zero `any` types — best of the three
- **Code-Archaeology:** Minimal `unknown`, zero `any` — also excellent

---

## Complexity Hotspots

| Repo | Hotspot | Complexity Score | Reason |
|------|---------|----------------|--------|
| AutoShip | hooks/opencode/dispatch.sh | HIGH | 500+ lines, complex state transitions |
| AutoShip | hooks/opencode/runner.sh | HIGH | Handles worker lifecycle, timeouts, failures, retries |
| AutoShip | hooks/opencode/reconcile-state.sh | HIGH | Complex state reconciliation logic |
| AutoResearch | src/cli.ts | HIGH | 733 lines, 15+ command dispatcher |
| AutoResearch | src/run-manager.ts | MEDIUM | State machine with iteration tracking |
| AutoResearch | src/subagent-pool.ts | MEDIUM | Dynamic role orchestration |
| Code-Archaeology | src/types.ts | LOW | 351 lines of type definitions only |

---

## Architectural Evolution

### Commit Trends

**AutoShip** (most active, 35 commits by Maleick):
- Started as TypeScript CLI for GitHub automation
- Grew complex Bash orchestration layer
- Added Hermes runtime (~10 recent commits)
- Added intelligent model routing, auto-prune, post-merge cleanup
- Most recent: semantic-release CI

**AutoResearch** (most mature, 94 commits by Maleick + 19 by Michael Miles):
- Started as self-improvement engine
- Evolved through 20+ self-improvement iterations
- Added subagent pool, wizard, CLI commands
- Added Hermes runtime support
- Most recent: coverage report updates, semantic-release

**Code-Archaeology** (youngest, 8 commits by Maleick):
- Initial V2 release with survey/excavate/restore modes
- Added model routing, Hermes support
- Most recent: semantic-release CI, robustness fixes

### Evolution Pattern
All three repos show:
1. **Phase 1:** Core TypeScript CLI + type definitions
2. **Phase 2:** Shell hook layer for orchestration
3. **Phase 3:** Hermes Agent runtime support
4. **Phase 4:** Model routing intelligence
5. **Phase 5:** CI/CD with semantic-release

---

## Shared Opportunities

| Finding | Affects | Priority |
|---------|---------|----------|
| Duplicate shell libraries | AutoShip, marginally Code-Archaeology | HIGH |
| Standardize hook patterns across repos | All 3 | MEDIUM |
| Document JSON state schemas more formally | All 3 | LOW |
| Add shellcheck CI to all repos | All 3 | MEDIUM |
| Standardize shebang (#!/usr/bin/env bash) | AutoShip, Code-Archaeology | LOW |
| Consolidate Hermes hook patterns | All 3 | MEDIUM |

---

## Recommendations for the Ecosystem

1. **Create shared tooling library** — Common functions (git root detection, JSON state I/O, config loading) are duplicated across repos. A shared `opencode-shared-utils` package would benefit all three.

2. **Unify Hermes integration pattern** — AutoShip has the most complex Hermes integration with duplicated OpenCode hooks. Consider AutoResearch's approach (shared hooks that work for both runtimes).

3. **Add cross-repo CI checks** — Validation that changes to one repo don't break the others (e.g., shared JSON state schemas, hook contract compatibility).

4. **Document the state JSON schemas** — All three repos define state shapes in TypeScript types. Publishing these as formal JSON Schema files would help consumers and tooling.

5. **Seed Code-Archaeology with actual analysis tools** — Currently the analysis is prompt-driven (AI analysis). Integrating knip, jscpd, madge, vulture, etc. into the CLI would provide a hybrid AI + tool approach.

---
*Cross-repo synthesis generated by Code Archaeology Survey mode.*
