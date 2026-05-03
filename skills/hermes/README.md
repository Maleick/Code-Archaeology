# Code Archaeology Hermes Skill

## Installation

```bash
# Clone Code Archaeology
git clone https://github.com/Maleick/Code-Archaeology.git
cd Code-Archaeology

# Install dependencies
npm install

# Verify
npm run typecheck
bash hooks/verify-package.sh
```

## Hermes Setup

### 1. Setup Hermes Runtime

```bash
cd ~/projects/Code-Archaeology
bash hooks/hermes/setup.sh
```

### 2. Create Session Config

```bash
# Create session config
cat > .archaeology/session.json <<'EOF'
{
  "runtime": "hermes",
  "status": "running",
  "current_phase": "site-survey",
  "completed_phases": [],
  "mode": "survey",
  "repo_path": ".",
  "language": "typescript",
  "test_command": "npm test",
  "typecheck_command": "npx tsc --noEmit",
  "branch_name": "refactor/archaeology",
  "strict_mode": false,
  "started_at": "2026-05-03T14:00:00Z"
}
EOF
```

### 3. Create Cronjob

```bash
hermes cronjob create \
  --name "code-archaeology-expedition" \
  --schedule "every 15m" \
  --workdir ~/projects/Code-Archaeology \
  --prompt "Run one Code Archaeology expedition phase. Read .archaeology/session.json, execute current phase with test/typecheck verification, advance to next phase. STOP after one phase."
```

## Usage

### Start Expedition

```bash
# Resume cron (first run auto-initializes)
hermes cronjob resume code-archaeology-expedition
```

### Check Status

```bash
cat .archaeology/session.json | jq .
ls .archaeology/expedition*-report.md
```

### Change Mode

```bash
# Switch from survey to excavate
jq '.mode = "excavate"' .archaeology/session.json > tmp.json && mv tmp.json .archaeology/session.json

# Switch from excavate to restore
jq '.mode = "restore"' .archaeology/session.json > tmp.json && mv tmp.json .archaeology/session.json
```

### Stop Expedition

```bash
# Set stop flag
jq '.status = "stopped"' .archaeology/session.json > tmp.json && mv tmp.json .archaeology/session.json

# Or pause cron
hermes cronjob pause code-archaeology-expedition
```

## Phase Timeline

With 15-minute intervals:
- 10 phases × 15 min = **2.5 hours minimum**
- Survey mode: ~2.5 hours (reports only)
- Restore mode: ~2.5 hours + verification time

## Reports Generated

| File | Content |
|------|---------|
| `.archaeology/site_survey.md` | Baseline inventory |
| `.archaeology/expedition1-report.md` | Site Survey |
| `.archaeology/expedition2-report.md` | Dead Code |
| `.archaeology/expedition3-report.md` | Legacy Removal |
| `.archaeology/expedition4-report.md` | Dependency Mapping |
| `.archaeology/expedition5-report.md` | Type Consolidation |
| `.archaeology/expedition6-report.md` | Type Hardening |
| `.archaeology/expedition7-report.md` | DRY Stratification |
| `.archaeology/expedition8-report.md` | Error Handling |
| `.archaeology/expedition9-report.md` | Artifact Cleaning |
| `.archaeology/FINAL_CATALOG.md` | Complete summary |
| `.archaeology/patches/*.patch` | Mock patches (excavate mode) |

## Safety

Same as OpenCode:
- Survey mode: **zero file changes outside `.archaeology/`**
- Restore mode: **test-gated, auto-revert on failure**
- Never removes try/catch from I/O boundaries
- Never guesses types; flags for human review

## Troubleshooting

### Cron not running

```bash
hermes cronjob list
hermes cronjob log code-archaeology-expedition
```

### Phase blocked

```bash
# Check blocker
cat .archaeology/session.json | jq '.flags.blocked_reason'

# Reset and retry
jq '.status = "running" | del(.flags.blocked_reason)' .archaeology/session.json > tmp.json && mv tmp.json .archaeology/session.json
```

### Reports empty

- Ensure `mode` is set correctly in session.json
- Check that language tools are installed (`knip`, `madge`, etc.)
- Run `bash hooks/opencode/init.sh` to reinitialize

## Comparison with OpenCode

| Feature | OpenCode | Hermes |
|---------|----------|--------|
| Entry | `/code-archaeology` | Cronjob |
| Phases | All in one session | One per 15-min cron |
| Real-time | Yes | Delayed |
| Slash variants | 3 commands | Mode flag in session |
| Background | Plugin active | Native cron |
| State | `.archaeology/session.json` | Same |

## Links

- Code Archaeology repo: https://github.com/Maleick/Code-Archaeology
- Hermes docs: https://hermes-agent.nousresearch.com/docs
- OpenCode plugin: `opencode-code-archaeology`
