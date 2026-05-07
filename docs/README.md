# Code Archaeology Documentation

Excavate technical debt. Restore with confidence.

Code Archaeology is a multi-runtime plugin for systematic codebase excavation, cataloging, and restoration. It supports both **OpenCode** (interactive slash commands) and **Hermes Agent** (cron-based background execution). It runs inside the target repository, writes local `.archaeology/` reports, and only modifies source files in `restore` mode after review and verification.

The public landing page is [`index.html`](index.html). These Markdown files remain the detailed documentation source.

## Quick Links

- [Install Guide](INSTALL.md)
- [Architecture](ARCHITECTURE.md)
- [Release Process](RELEASE.md)
- [Security Audit](SECURITY_AUDIT.md)
- [Repository README](../README.md)
- [Root Install Handoff](../INSTALL.md)
- [Hermes Integration](../skills/hermes/INTEGRATION.md)
- [Hermes Skill](../skills/hermes/README.md)

## Quick Start

### OpenCode

Install the package globally, register the plugin, then verify the CLI:

```bash
npm install -g opencode-code-archaeology@2.2.0 && opencode-code-archaeology install && opencode-code-archaeology doctor
```

Or tell OpenCode:

```text
Fetch and follow the instructions in the installed package's INSTALL.md at $(npm root -g)/opencode-code-archaeology/INSTALL.md for opencode-code-archaeology@2.2.0
```

Restart OpenCode in the repository you want to inspect and start with the non-destructive default command:

```text
/code-archaeology
```

This runs the full 10-phase survey chain without per-phase prompts, writes reports under `.archaeology/`, and makes no source-code changes.

Review `.archaeology/site_survey.md` and expedition reports before using:

```text
/code-archaeology-excavate
/code-archaeology-restore
```

### Hermes Agent

Setup the Hermes runtime and create a cronjob:

```bash
cd ~/projects/Code-Archaeology
bash hooks/hermes/setup.sh

hermes cronjob create \
  --name "code-archaeology-expedition" \
  --schedule "every 15m" \
  --workdir ~/projects/Code-Archaeology \
  --prompt "Run one Code Archaeology expedition phase. Read .archaeology/session.json, execute current phase with test/typecheck verification, advance to next phase. STOP after one phase."
```

Each cron run executes exactly **one** phase. Ten phases complete in ~2.5 hours minimum.

## Safety Warning

`/code-archaeology` defaults to survey mode and writes reports only. `excavate` mode writes reports and mock patches. `restore` mode can edit source files and should only run after report review, on an isolated branch, with tests or type checks available.

Do not commit `.archaeology/`; it is local runtime state.
