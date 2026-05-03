# Install Code Archaeology

This guide mirrors the root [`INSTALL.md`](../INSTALL.md) and covers the recommended OpenCode plugin configuration plus the npm CLI install path.

## Prerequisites

- OpenCode installed and available in your shell.
- Node.js 18 or newer with npm.
- Git installed and available in your shell.
- A target repository with tests or type checks before running `restore` mode.

## Recommended OpenCode Plugin Install

Add Code Archaeology to the top-level `plugin` array in `opencode.json`:

```json
{
  "plugin": [
    "opencode-code-archaeology@git+https://github.com/Maleick/Code-Archaeology.git"
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

## npm Global Install

Use the npm package when you want the CLI installer and diagnostics:

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
```

To verify plugin behavior, restart OpenCode in a Git repository and run:

```text
/code-archaeology-survey
```

The survey should create `.archaeology/` reports without modifying source files.

## Updating

For plugin-array installs, update through your OpenCode package manager flow, then restart OpenCode. If your setup caches Git plugins, clear the cached `opencode-code-archaeology` package and let OpenCode reinstall it.

For npm global installs:

```bash
npm install -g opencode-code-archaeology@latest
npm list -g opencode-code-archaeology --depth=0
opencode-code-archaeology doctor
```

## Troubleshooting

### Plugin Not Loading

- Confirm `opencode.json` is valid JSON.
- Confirm the package entry is in the top-level `plugin` array, not `plugins`.
- Restart OpenCode after changing configuration.
- Confirm Git can reach `https://github.com/Maleick/Code-Archaeology.git`.

### Commands Not Found

- Restart OpenCode so it reloads plugin commands.
- Confirm the npm package installed with `npm list -g opencode-code-archaeology --depth=0` if using the global path.
- Run `/code-archaeology-survey` from inside a Git repository.

### Stale Cache

- Remove the cached OpenCode package for `opencode-code-archaeology` if your runtime keeps one.
- Reinstall or rerun OpenCode plugin resolution.
- Restart OpenCode before testing again.

### Restore Safety

- Start with `/code-archaeology-survey`; it writes reports only.
- Review `.archaeology/site_survey.md` and expedition reports before restore.
- Use `/code-archaeology-excavate` for mock patches if you want another review gate.
- Run `/code-archaeology-restore` only when the target repository has tests or type checks available.
- Do not commit `.archaeology/`; it is local runtime state.
