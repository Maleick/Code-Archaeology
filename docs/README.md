# Code Archaeology Documentation

Code Archaeology is an OpenCode plugin for systematic codebase excavation, cataloging, and restoration. It runs inside the target repository, writes local `.archaeology/` reports, and only modifies source files in `restore` mode after review and verification.

These Markdown files are ready to serve from GitHub Pages, but this repository does not assume Pages is already enabled.

## Quick Links

- [Install Guide](INSTALL.md)
- [Architecture](ARCHITECTURE.md)
- [Release Process](RELEASE.md)
- [Security Audit](SECURITY_AUDIT.md)
- [Repository README](../README.md)
- [Root Install Handoff](../INSTALL.md)

## Quick Start

Install the package globally, register the plugin, then verify the CLI:

```bash
npm install -g opencode-code-archaeology
opencode-code-archaeology install
opencode-code-archaeology doctor
opencode-code-archaeology version
```

Restart OpenCode in the repository you want to inspect and start with the non-destructive survey command:

```text
/code-archaeology-survey
```

Review `.archaeology/site_survey.md` and expedition reports before using:

```text
/code-archaeology-excavate
/code-archaeology-restore
```

## Safety Warning

`survey` mode writes reports only. `excavate` mode writes reports and mock patches. `restore` mode can edit source files and should only run after report review, on an isolated branch, with tests or type checks available.

Do not commit `.archaeology/`; it is local runtime state.
