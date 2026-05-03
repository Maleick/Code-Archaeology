# Code Archaeology Wiki

Code Archaeology is an OpenCode plugin for systematic codebase excavation, cataloging, and restoration. It runs a fixed, report-first workflow and keeps runtime artifacts local in `.archaeology/`.

## Navigation

- [Installation](Installation)
- [Expedition Workflow](Expedition-Workflow)
- [Security and Safety](Security-and-Safety)
- [Release Process](Release-Process)

## Quick Start

```bash
npm install -g opencode-code-archaeology
opencode-code-archaeology install
opencode-code-archaeology doctor
opencode-code-archaeology version
```

Restart OpenCode inside a Git repository and run:

```text
/code-archaeology-survey
```

Start with `survey`, review reports, then choose `excavate` for mock patches or `restore` for approved, test-gated changes.
