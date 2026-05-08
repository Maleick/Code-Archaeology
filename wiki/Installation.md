# Installation

[Home](Home) | [Workflow](Expedition-Workflow) | [Security](Security-and-Safety) | [Release](Release-Process)

## OpenCode Plugin Install

Add the package to the top-level `plugin` array in `opencode.json`:

```json
{
  "plugin": [
    "opencode-code-archaeology@git+https://github.com/Maleick/Code-Archaeology.git"
  ]
}
```

Restart OpenCode. Commands should be available inside a Git repository:

```text
/code-archaeology
/code-archaeology-survey
/code-archaeology-excavate
/code-archaeology-restore
/code-archaeology --yolo
```

`/code-archaeology` runs the full 10-phase survey chain by default without per-phase prompts. It writes reports under `.archaeology/` and makes no source-code changes. Use `/code-archaeology-restore` only after reviewing the reports and deciding to apply changes.
`/code-archaeology --yolo` runs full restoration in one shot with `strict_mode` enabled.

## npm CLI Path

```bash
npm install -g opencode-code-archaeology
opencode-code-archaeology install
opencode-code-archaeology doctor
opencode-code-archaeology version
```

For updates:

```bash
npm install -g opencode-code-archaeology@latest
npm list -g opencode-code-archaeology --depth=0
```

If commands do not appear, restart OpenCode, verify `opencode.json` uses `plugin` singular, and clear any stale OpenCode plugin cache.
