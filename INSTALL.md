# Install Code Archaeology

Code Archaeology is a multi-runtime plugin for systematic codebase excavation. It is non-destructive by default: `survey` mode writes reports only, while `restore` mode modifies code after review and verification.

## Runtimes

- **OpenCode** — Interactive slash-command runtime (`/code-archaeology`)
- **Hermes Agent** — Cron-based background runtime (one phase per 15-minute run)

## OpenCode Handoff

Paste this into OpenCode if you want the agent to install and verify the plugin for you:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/Maleick/Code-Archaeology/refs/heads/main/INSTALL.md
```

## Prerequisites

- Node.js with npm, or Bun if your setup uses Bun package resolution.
- Git installed and available in your shell.
- A target repository with tests or type checks available before you run `restore` mode.
- For Hermes: Hermes Agent CLI or an active Hermes session.

## Recommended OpenCode Plugin Install

Add Code Archaeology to your `opencode.json` plugin array:

```json
{
  "plugin": [
    "opencode-code-archaeology@git+https://github.com/Maleick/Code-Archaeology.git"
  ]
}
```

Restart OpenCode after editing the configuration. The command family should then be available inside your target repository:

```text
/code-archaeology
/code-archaeology-survey
/code-archaeology-excavate
/code-archaeology-restore
```

## Hermes Setup

### 1. Install Code Archaeology CLI

```bash
npm install -g opencode-code-archaeology
```

### 2. Setup Hermes Runtime

```bash
cd ~/projects/Code-Archaeology
bash hooks/hermes/setup.sh
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
npm install -g opencode-code-archaeology
opencode-code-archaeology install
opencode-code-archaeology doctor
opencode-code-archaeology version
```

Then restart OpenCode and run:

```text
/code-archaeology-survey
```

## One-Time Bun Path

If your environment supports one-time package execution through Bun:

```bash
bunx opencode-code-archaeology install
bunx opencode-code-archaeology doctor
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

To verify command availability, restart OpenCode in a Git repository and run:

```text
/code-archaeology-survey
```

The survey should create `.archaeology/` reports without modifying source files.

## Updating

For plugin-array installs, update through your OpenCode package manager flow, then restart OpenCode. If your setup caches git plugins, clear the cached plugin package and let OpenCode reinstall it.

For npm global installs:

```bash
npm install -g opencode-code-archaeology@latest
npm list -g opencode-code-archaeology --depth=0
```

## Troubleshooting

### Plugin Not Loading (OpenCode)

- Confirm `opencode.json` is valid JSON.
- Confirm the plugin entry is in the top-level `plugin` array.
- Restart OpenCode after changing the config.
- Check that Git can reach `https://github.com/Maleick/Code-Archaeology.git`.

### Commands Not Found (OpenCode)

- Restart OpenCode so it reloads plugin commands.
- Confirm the package installed successfully with `npm list -g opencode-code-archaeology --depth=0` if using the global path.
- Run `/code-archaeology-survey` from inside a Git repository, not from an empty directory.

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

- Start with `/code-archaeology-survey` (OpenCode) or `mode = "survey"` (Hermes); it writes reports only.
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
