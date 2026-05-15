# Install Code Archaeology

Code Archaeology is a multi-runtime plugin for systematic codebase excavation. It is non-destructive by default: `survey` mode writes reports only, while `restore` mode modifies code after review and verification, and `yolo` mode applies medium-confidence fixes in one step.

## Runtimes

- **OpenCode** — Interactive slash-command runtime (`/code-archaeology`)
- **Codex** — Interactive skill runtime (`code-archaeology`)
- **Hermes Agent** — Cron-based background runtime (one phase per 15-minute run)

## Claude Code Install

Copy commands and the Claude Code skill into your project:

```bash
# macOS/Linux — from the Code-Archaeology repo root
cp commands/code-archaeology*.md /path/to/your-project/.claude/commands/
mkdir -p /path/to/your-project/.claude/plugins/code-archaeology/skills/code-archaeology
cp skills/claude-code/SKILL.md \
  /path/to/your-project/.claude/plugins/code-archaeology/skills/code-archaeology/SKILL.md
```

```powershell
# Windows — from the Code-Archaeology repo root
Copy-Item commands\code-archaeology*.md \path\to\your-project\.claude\commands\
New-Item -ItemType Directory -Force \path\to\your-project\.claude\plugins\code-archaeology\skills\code-archaeology
Copy-Item skills\claude-code\SKILL.md \path\to\your-project\.claude\plugins\code-archaeology\skills\code-archaeology\SKILL.md
```

Restart Claude Code, then run `/code-archaeology` from inside a Git repository.

See [`skills/claude-code/INTEGRATION.md`](skills/claude-code/INTEGRATION.md) for global install, session flow details, and troubleshooting.

## OpenCode Handoff

Paste this into OpenCode if you want the agent to install and verify the plugin for you:

```text
Run `npm pack opencode-code-archaeology@2.8.1`, extract the resulting tarball, then open and follow `package/INSTALL.md` from that tarball. If you need a concrete command sequence: `npm pack opencode-code-archaeology@2.8.1 && tar -xof opencode-code-archaeology-2.8.1.tgz && cat package/INSTALL.md`.
```

## Prerequisites

- Node.js with npm, or Bun if your setup uses Bun package resolution.
- Git installed and available in your shell.
- A target repository with tests or type checks available before you run `restore` or `yolo` mode.
- For Codex: Codex with skill loading from `$CODEX_HOME/skills`.
- For Hermes: Hermes Agent CLI or an active Hermes session.
- **Windows**: PowerShell 5.1 or later (hooks use `.ps1` scripts on Windows).

## Recommended OpenCode Plugin Install

Add Code Archaeology to your `opencode.json` plugin array:

```json
{
  "plugin": [
    "opencode-code-archaeology@2.8.1"
  ]
}
```

Restart OpenCode after editing the configuration. The command family should then be available inside your target repository:

```text
/code-archaeology
/code-archaeology-survey
/code-archaeology-excavate
/code-archaeology-restore
/code-archaeology --yolo
```

`/code-archaeology` runs the full 10-phase survey chain by default without per-phase prompts. It writes reports under `.archaeology/` and makes no source-code changes. Use `/code-archaeology-restore` only after reviewing the reports and deciding to apply changes.
`/code-archaeology --yolo` runs full restoration in one shot with `strict_mode` enabled.

## Codex Skill Install

Install the package globally, then copy the Codex skill into `$CODEX_HOME/skills/code-archaeology`:

```bash
npm install -g opencode-code-archaeology@2.8.1
opencode-code-archaeology install-codex
```

Restart Codex or start a new Codex session so the skill list reloads. From a target repository, ask:

```text
Use code-archaeology in survey mode.
Use code-archaeology in excavate mode.
Use code-archaeology in restore mode after reviewing the reports.
```

## Hermes Setup

### 1. Install Code Archaeology CLI

```bash
npm install -g opencode-code-archaeology@2.8.1
```

### 2. Setup Hermes Runtime

**macOS/Linux:**
```bash
cd ~/projects/Code-Archaeology
bash hooks/hermes/setup.sh
```

**Windows:**
```powershell
cd ~/projects/Code-Archaeology
.\hooks\hermes\setup.ps1
```

### 3. Create Hermes Cronjob

```bash
hermes cronjob create \
  --name "code-archaeology-expedition" \
  --schedule "every 15m" \
  --workdir ~/projects/Code-Archaeology \
  --prompt "Run one Code Archaeology expedition phase. Read .archaeology/session.json, execute current phase with verification, advance to next phase."
```

See `skills/hermes/INTEGRATION.md` for full Hermes integration details.

## npm Global Install

If you prefer a global package install:

```bash
npm install -g opencode-code-archaeology@2.8.1
opencode-code-archaeology install
opencode-code-archaeology install-codex
opencode-code-archaeology doctor
opencode-code-archaeology version
```

Then restart OpenCode and run:

```text
/code-archaeology
```

## One-Time Bun Path

If your environment supports one-time package execution through Bun:

```bash
bunx opencode-code-archaeology@2.8.1 install
bunx opencode-code-archaeology@2.8.1 doctor
```

Use the plugin-array install for normal OpenCode usage.

## Verification

These checks do not require secrets:

```bash
npm view opencode-code-archaeology version
npm view opencode-code-archaeology dist-tags
opencode-code-archaeology doctor
```

For a local clone:

```bash
npm install
npm run build
npm run typecheck
bash -n hooks/opencode/*.sh
bash -n hooks/hermes/*.sh
```

**Windows:**
```powershell
npm install
npm run build
npm run typecheck
Get-ChildItem hooks/opencode/*.ps1 | ForEach-Object { Get-Command $_.FullName }
Get-ChildItem hooks/hermes/*.ps1 | ForEach-Object { Get-Command $_.FullName }
```

To verify command availability, restart OpenCode in a Git repository and run:

```text
/code-archaeology
```

The default survey chain should create `.archaeology/` reports without modifying source files or asking to proceed phase by phase.

## Updating

For plugin-array installs, update by changing the package version to a reviewed npm release, then restart OpenCode. Do not point OpenCode at a mutable Git branch such as `main` for automatic updates.

For npm global installs:

```bash
npm install -g opencode-code-archaeology@2.8.1
npm list -g opencode-code-archaeology --depth=0
```

## Troubleshooting

### Plugin Not Loading (OpenCode)

- Confirm `opencode.json` is valid JSON.
- Confirm the plugin entry is in the top-level `plugin` array.
- Restart OpenCode after changing the config.
- Check that npm can resolve the pinned `opencode-code-archaeology` release.

### Commands Not Found (OpenCode)

- Restart OpenCode so it reloads plugin commands.
- Confirm the package installed successfully with `npm list -g opencode-code-archaeology --depth=0` if using the global path.
- Run `/code-archaeology` from inside a Git repository, not from an empty directory.

### Skill Not Found (Codex)

- Run `opencode-code-archaeology install-codex`.
- Confirm the skill exists at `$CODEX_HOME/skills/code-archaeology/SKILL.md` or `~/.codex/skills/code-archaeology/SKILL.md`.
- Restart Codex or start a new session after installing the skill.
- Ask for `code-archaeology` from inside a Git repository.

### Cron Not Running (Hermes)

```bash
hermes cronjob list
hermes cronjob log code-archaeology-expedition
```

### Phase Blocked (Hermes)

```bash
# Check blocker
cat .archaeology/session.json | jq '.flags.blocked_reason'

# Reset and retry
jq '.status = "running" | del(.flags.blocked_reason)' .archaeology/session.json > tmp.json && mv tmp.json .archaeology/session.json
```

### Stale Cache

- Remove the cached OpenCode package for `opencode-code-archaeology` if your runtime keeps one.
- Reinstall or rerun the OpenCode plugin resolution step.
- Restart OpenCode before testing again.

### Restore Safety

- Start with `/code-archaeology` (OpenCode) or `mode = "survey"` (Hermes); it writes reports only.
- Review `.archaeology/site_survey.md` and expedition reports before restore.
- Use `/code-archaeology-excavate` (OpenCode) or `mode = "excavate"` (Hermes) for mock patches if you want another review gate.
- Run `/code-archaeology-restore` (OpenCode) or `mode = "restore"` (Hermes) only when the target repository has tests or type checks available.
- Do not commit `.archaeology/`; it is local runtime state.

## Links

- Documentation: https://github.com/Maleick/Code-Archaeology/tree/main/docs
- Wiki: https://github.com/Maleick/Code-Archaeology/wiki
- Releases: https://github.com/Maleick/Code-Archaeology/releases
- Issues: https://github.com/Maleick/Code-Archaeology/issues
- Hermes docs: https://hermes-agent.nousresearch.com/docs
