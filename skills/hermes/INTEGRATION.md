# Code Archaeology Hermes Integration

## Overview

Code Archaeology can run on Hermes Agent using cron-based phase execution. Each cron run executes exactly ONE expedition phase with test gates between phases.

## Architecture

```
Hermes Cron (every 15m)
  → Read .archaeology/session.json
  → Detect current phase (1 of 10)
  → Execute ONE phase:
      survey → excavate → restore (per phase)
  → Run test/typecheck verification
  → Keep or revert changes
  → Advance to next phase
  → STOP (next cron continues)
```

## Key Differences from OpenCode

| Feature | OpenCode | Hermes |
|---------|----------|--------|
| Entry | `/code-archaeology` slash command | `cronjob` |
| Phases | All in one session | One per cron run |
| Verification | Between expeditions | Between every phase |
| Revert | Manual or automatic | Automatic on failure |
| State | `.archaeology/session.json` | Same file |
| Background | Plugin stays active | Cron resumes automatically |

## Setup

```bash
# 1. Install Code Archaeology CLI
npm install -g opencode-code-archaeology

# 2. Setup Hermes runtime
cd ~/projects/Code-Archaeology
bash hooks/hermes/setup.sh

# 3. Create Hermes cronjob
hermes cronjob create \
  --name "code-archaeology-expedition" \
  --schedule "every 15m" \
  --workdir ~/projects/Code-Archaeology \
  --prompt "Run one Code Archaeology expedition phase. Read .archaeology/session.json, execute current phase with verification, advance to next phase."
```

## Hermes Prompt Template

See `skills/hermes/code-archaeology-prompt.md` for the full cron prompt.

## Commands Mapping

| OpenCode | Hermes |
|----------|--------|
| `/code-archaeology` | `cronjob` runs expedition loop |
| `/code-archaeology-survey` | `mode = "survey"` in session.json |
| `/code-archaeology-excavate` | `mode = "excavate"` in session.json |
| `/code-archaeology-restore` | `mode = "restore"` in session.json |

## Session File Format

Hermes uses the same `.archaeology/session.json` format as OpenCode:

```json
{
  "runtime": "hermes",
  "status": "running",
  "current_phase": "dead-code",
  "completed_phases": ["site-survey"],
  "mode": "survey",
  "repo_path": ".",
  "language": "typescript",
  "test_command": "npm test",
  "typecheck_command": "npx tsc --noEmit",
  "branch_name": "refactor/archaeology",
  "strict_mode": false,
  "started_at": "2026-05-03T14:00:00Z"
}
```

## 10-Phase Expedition Order

| # | Phase | Hermes Action |
|---|-------|---------------|
| 1 | Site Survey & Baseline | Generate inventory report |
| 2 | Dead Code Excavation | Catalog unused code |
| 3 | Legacy Stratum Removal | Identify deprecated shims |
| 4 | Circular Dependency Cartography | Map dependency cycles |
| 5 | Type Catalog Consolidation | Find duplicate types |
| 6 | Type Restoration & Hardening | Flag weak types |
| 7 | DRY Stratification | Find semantic duplication |
| 8 | Error Handling Stratigraphy | Review error patterns |
| 9 | Artifact Cleaning & Documentation | Clean stale artifacts |
| 10 | Site Preservation & Final Catalog | Generate FINAL_CATALOG.md |

## Safety Model

Same as OpenCode:
- `survey` is default — reports only, zero edits
- `restore` modifies code only after review
- Tests and type checks gate each phase
- Failed restores are automatically reverted
- Never remove try/catch from I/O boundaries

## Limitations

- One phase per cron run (10 phases = ~2.5 hours minimum)
- No real-time slash command variants
- Phase order is fixed; cannot skip ahead
- Memory is session-based; use `memory` tool for persistence

## Future Enhancements

- [ ] Auto-detect optimal phase interval based on repo size
- [ ] Parallel subagent analysis within a phase (Scout + Analyst)
- [ ] Cross-session memory for language-specific patterns
- [ ] Integration with Hermes checkpoint/rollback for safe resets
