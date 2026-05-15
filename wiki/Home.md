# Code Archaeology Wiki

Code Archaeology is a multi-runtime tool for systematic codebase excavation, cataloging, and restoration. It supports OpenCode, Codex, and Hermes Agent while keeping runtime artifacts local in `.archaeology/`.

## Navigation

- [Installation](Installation)
- [Expedition Workflow](Expedition-Workflow)
- [Security and Safety](Security-and-Safety)
- [Release Process](Release-Process)

## Quick Start

```bash
npm install -g opencode-code-archaeology
opencode-code-archaeology install
opencode-code-archaeology install-codex
opencode-code-archaeology doctor
opencode-code-archaeology version
```

Restart OpenCode inside a Git repository and run:

```text
/code-archaeology
/code-archaeology --yolo
```

`/code-archaeology` runs the full 10-phase survey chain without per-phase prompts, writes `.archaeology/` reports only, and makes no source-code changes. Review reports, then choose `excavate` for mock patches or `restore` for approved, test-gated changes.
`/code-archaeology --yolo` runs all phases in unattended restore mode using `strict_mode`.

For Codex, restart Codex after `install-codex`, then ask it to use `code-archaeology` in survey, excavate, or restore mode from inside the target repository.
