# Install Code Archaeology

Code Archaeology is an OpenCode plugin for systematic codebase excavation. It is non-destructive by default: `survey` mode writes reports only, while `restore` mode modifies code after review and verification.

## OpenCode Handoff

Paste this into OpenCode if you want the agent to install and verify the plugin for you:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/Maleick/Code-Archaeology/refs/heads/main/INSTALL.md
```

## Prerequisites

- OpenCode installed and available in your shell.
- Node.js with npm, or Bun if your OpenCode setup uses Bun package resolution.
- Git installed and available in your shell.
- A target repository with tests or type checks available before you run `restore` mode.

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

### Plugin Not Loading

- Confirm `opencode.json` is valid JSON.
- Confirm the plugin entry is in the top-level `plugin` array.
- Restart OpenCode after changing the config.
- Check that Git can reach `https://github.com/Maleick/Code-Archaeology.git`.

### Commands Not Found

- Restart OpenCode so it reloads plugin commands.
- Confirm the package installed successfully with `npm list -g opencode-code-archaeology --depth=0` if using the global path.
- Run `/code-archaeology-survey` from inside a Git repository, not from an empty directory.

### Stale Cache

- Remove the cached OpenCode package for `opencode-code-archaeology` if your runtime keeps one.
- Reinstall or rerun the OpenCode plugin resolution step.
- Restart OpenCode before testing again.

### Restore Safety

- Start with `/code-archaeology-survey`; it writes reports only.
- Review `.archaeology/site_survey.md` and expedition reports before restore.
- Use `/code-archaeology-excavate` for mock patches if you want another review gate.
- Run `/code-archaeology-restore` only when the target repository has tests or type checks available.
- Do not commit `.archaeology/`; it is local runtime state.

## Links

- Documentation: https://github.com/Maleick/Code-Archaeology/tree/main/docs
- Wiki: https://github.com/Maleick/Code-Archaeology/wiki
- Releases: https://github.com/Maleick/Code-Archaeology/releases
- Issues: https://github.com/Maleick/Code-Archaeology/issues
