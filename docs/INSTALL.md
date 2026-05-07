# Install Code Archaeology

This guide mirrors the root [`INSTALL.md`](../INSTALL.md) and covers the recommended OpenCode plugin configuration, npm CLI install path, and Hermes Agent setup.

## Prerequisites

- OpenCode installed and available in your shell.
- Node.js 18 or newer with npm.
- Git installed and available in your shell.
- A target repository with tests or type checks before running `restore` mode.
- For Hermes: Hermes Agent CLI or an active Hermes session.

## Recommended OpenCode Plugin Install

Add Code Archaeology to the top-level `plugin` array in `opencode.json`:

```json
{
  "plugin": [
    "opencode-code-archaeology@2.2.0"
  ]
}
```

Restart OpenCode after editing the configuration. The command family should then be available inside a Git repository:

```text
/code-archaeology
/code-archaeology-survey
/code-archaeology-excavate
/code-archaeology-restore
```

`/code-archaeology` runs the full 10-phase survey chain by default without per-phase prompts. It writes reports under `.archaeology/` and makes no source-code changes. Use `/code-archaeology-restore` only after reviewing the reports and deciding to apply changes.

## npm Global Install

Use the npm package when you want the CLI installer and diagnostics:

```bash
npm install -g opencode-code-archaeology@2.2.0
opencode-code-archaeology install
opencode-code-archaeology doctor
opencode-code-archaeology version
```

Then restart OpenCode and run:

```text
/code-archaeology
```

## Hermes Setup

Install the CLI globally so Hermes can invoke Code Archaeology commands. To initialize Hermes runtime metadata, run the hook from a local clone or from the unpacked package contents:

```bash
npm install -g opencode-code-archaeology@2.2.0
cd ~/projects/Code-Archaeology
bash hooks/hermes/setup.sh
```

Create a cronjob that runs exactly one expedition phase per invocation:

```bash
hermes cronjob create \
  --name "code-archaeology-expedition" \
  --schedule "every 15m" \
  --workdir ~/projects/Code-Archaeology \
  --prompt "Run one Code Archaeology expedition phase. Read .archaeology/session.json, execute current phase with verification, advance to next phase."
```

See [`skills/hermes/INTEGRATION.md`](../skills/hermes/INTEGRATION.md) for the full Hermes workflow.

## Verification

Confirm the published package and local CLI are visible:

```bash
npm view opencode-code-archaeology version
npm view opencode-code-archaeology dist-tags
opencode-code-archaeology doctor
opencode-code-archaeology version
```

For a local clone, run focused package checks:

```bash
npm install
npm run build
npm run typecheck
bash -n hooks/opencode/*.sh
bash -n hooks/hermes/*.sh
```

To verify plugin behavior, restart OpenCode in a Git repository and run:

```text
/code-archaeology
```

The default survey chain should create `.archaeology/` reports without modifying source files or asking to proceed phase by phase.

## Updating

For plugin-array installs, update by changing the package version to a reviewed npm release, then restart OpenCode. Do not point OpenCode at a mutable Git branch such as `main` for automatic updates.

For npm global installs:

```bash
npm install -g opencode-code-archaeology@2.2.0
npm list -g opencode-code-archaeology --depth=0
opencode-code-archaeology doctor
```

## Troubleshooting

### Plugin Not Loading

- Confirm `opencode.json` is valid JSON.
- Confirm the package entry is in the top-level `plugin` array, not `plugins`.
- Restart OpenCode after changing configuration.
- Confirm npm can resolve the pinned `opencode-code-archaeology` release.

### Commands Not Found

- Restart OpenCode so it reloads plugin commands.
- Confirm the npm package installed with `npm list -g opencode-code-archaeology --depth=0` if using the global path.
- Run `/code-archaeology` from inside a Git repository.

### Cron Not Running

```bash
hermes cronjob list
hermes cronjob log code-archaeology-expedition
```

### Phase Blocked

```bash
cat .archaeology/session.json | jq '.flags.blocked_reason'
```

### Stale Cache

- Remove the cached OpenCode package for `opencode-code-archaeology` if your runtime keeps one.
- Reinstall or rerun OpenCode plugin resolution.
- Restart OpenCode before testing again.

### Restore Safety

- Start with `/code-archaeology`; it writes reports only.
- Review `.archaeology/site_survey.md` and expedition reports before restore.
- Use `/code-archaeology-excavate` for mock patches if you want another review gate.
- Run `/code-archaeology-restore` only when the target repository has tests or type checks available.
- Do not commit `.archaeology/`; it is local runtime state.
