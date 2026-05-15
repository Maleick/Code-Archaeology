# Code Archaeology — Claude Code Integration

## Overview

Code Archaeology runs as a Claude Code plugin providing slash commands and a skill for interactive, session-based expedition execution. All 10 phases run in a single Claude Code session, with `TodoWrite` tracking progress between phases.

## Key Differences from OpenCode

| Feature | OpenCode | Claude Code |
|---------|----------|-------------|
| Entry | `/code-archaeology` slash command | `/code-archaeology` slash command |
| Plugin format | `opencode.json` plugin array | `.claude/` directory |
| Phase tracking | Internal session state | `TodoWrite` todo list |
| Task tools | `TaskCreate` / `TaskUpdate` | `TodoWrite` |
| Model routing | `config/model-routing.json` | Claude model selection |
| Background execution | Hermes cron | Not applicable |

## Installation

### Option 1: Project-level (recommended)

Copy the commands and skill into your project's `.claude/` directory:

```bash
# From the Code-Archaeology repo root
cp commands/code-archaeology*.md /path/to/your-project/.claude/commands/
mkdir -p /path/to/your-project/.claude/plugins/code-archaeology/skills/code-archaeology
cp skills/claude-code/SKILL.md \
  /path/to/your-project/.claude/plugins/code-archaeology/skills/code-archaeology/SKILL.md
```

Then restart Claude Code in your project.

### Option 2: Global install

Copy commands to your global Claude Code commands directory:

```bash
# macOS/Linux
cp commands/code-archaeology*.md ~/.claude/commands/

# Windows (PowerShell)
Copy-Item commands\code-archaeology*.md ~\.claude\commands\
```

### Verification

After restarting Claude Code, run:

```
/code-archaeology
```

The survey chain should start immediately, creating `.archaeology/` reports without touching source files.

## Commands

| Command | Description |
|---------|-------------|
| `/code-archaeology` | Full 10-phase survey chain, no per-phase prompts |
| `/code-archaeology-survey` | Site survey only — zero file changes |
| `/code-archaeology-excavate` | Reports + mock patches for review |
| `/code-archaeology-restore` | Execute approved changes |
| `/code-archaeology --yolo` | Full unattended restore with strict mode |

## Session Flow

Claude Code runs all phases in a single interactive session:

```
Claude Code session
  → /code-archaeology
  → TodoWrite: create 10 phase todos
  → Phase 1: Site Survey & Baseline
      → mark in_progress
      → run analysis
      → write .archaeology/site_survey.md
      → mark completed
  → Phase 2: Dead Code Excavation
      → mark in_progress
      → ...
  → [continues through all 10 phases]
  → Phase 10: Site Preservation & Final Catalog
      → write .archaeology/FINAL_CATALOG.md
      → mark completed
```

## Safety Model

Same as all runtimes:

- `survey` is default — reports only, zero edits
- `restore` modifies code only after explicit `/code-archaeology-restore`
- `yolo` applies restore behavior with strict confidence and no review gate
- Tests and type checks gate each phase in restore/yolo mode
- Failed restores are automatically reverted
- Never removes try/catch from I/O boundaries

## Limitations

- All phases run in one Claude Code session (no cron/background execution — use Hermes for that)
- Long expeditions may approach context limits on very large codebases; use `/code-archaeology-survey` then `/code-archaeology-restore` as separate sessions if needed
- Model selection is handled by Claude Code, not `config/model-routing.json`

## Troubleshooting

### Commands not found

- Confirm files are in `.claude/commands/` (project) or `~/.claude/commands/` (global)
- Restart Claude Code after adding files
- Run from inside a Git repository

### Phase fails verification

Check `.archaeology/expeditionN-report.md` for findings. For restore mode, the phase is automatically reverted on test failure — review the report and decide whether to proceed manually.

### Context length on large codebases

Split into separate sessions:
1. `/code-archaeology-survey` — generate all reports
2. Review `.archaeology/` reports
3. `/code-archaeology-restore` — apply changes in a fresh session
