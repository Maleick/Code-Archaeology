# Code Archaeology

[![GitHub Release](https://img.shields.io/github/v/release/Maleick/Code-Archaeology)](https://github.com/Maleick/Code-Archaeology/releases)

A systematic excavation plugin for OpenCode. Removes accumulated sediment from a codebase—dead code, legacy fallbacks, circular dependencies, weak types, and defensive programming slop—to restore the original architecture.

## ⚠️ Site Safety

This plugin modifies code. By default it runs in **survey** mode, producing site reports only. Review these before switching to `restore` mode.

## Prerequisites

- Git repo with clean working tree
- Passing test suite (even if minimal)
- Type checker / linter installed
- `opencode` CLI available

## Installation

### For OpenCode Users (Recommended)

Add to your OpenCode plugin configuration (`~/.config/opencode/package.json`):

```json
{
  "dependencies": {
    "opencode-code-archaeology": "github:Maleick/Code-Archaeology#main"
  }
}
```

Then run:

```bash
bun install
```

OpenCode will automatically load the plugin on next start.

### Manual / Development

```bash
# Clone and link for local development
git clone https://github.com/Maleick/Code-Archaeology.git
cd Code-Archaeology
npm install
npm link
```

### Auto-Update

This plugin supports automatic updates via `bun update`:

- **Source of truth**: The `main` branch on GitHub (not npm or GitHub Releases)
- **Update mechanism**: A daily `bun update` job pulls the latest commit from `main`
- **Cache location**: `~/.cache/opencode/packages/opencode-code-archaeology/`

**To verify your installed version:**

```bash
cat ~/.config/opencode/node_modules/opencode-code-archaeology/package.json | grep version
```

This should match the latest commit on `main` and the version shown in this repository's `package.json`.

**Note for maintainers:** When releasing, always bump `package.json` version and commit to `main`. GitHub Releases are for discoverability and changelogs only; the `main` branch is what consumers actually receive.

## Usage

```bash
# 1. Survey — catalog artifacts, zero changes
opencode run code-archaeology --mode survey

# 2. Review reports in .archaeology/
cat .archaeology/expedition1-report.md
# ... etc

# 3. Restore high-confidence findings only
opencode run code-archaeology --mode restore --strict_mode false

# 4. Or restore medium+high confidence
opencode run code-archaeology --mode restore --strict_mode true
```

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `repo_path` | `.` | Target repository |
| `language` | `typescript` | Primary language |
| `mode` | `survey` | `survey`, `excavate`, or `restore` |
| `strict_mode` | `false` | Auto-restore medium-confidence findings |
| `test_command` | `npm test` | Test runner command |
| `typecheck_command` | `npx tsc --noEmit` | Type check command |
| `branch_name` | `refactor/archaeology` | Git branch to create |

## Output Artifacts

All artifacts are written to `.archaeology/`:

- `site_survey.md` — baseline inventory and stratum graph
- `expedition1-report.md` through `expedition8-report.md` — per-expedition findings
- `FINAL_CATALOG.md` — completed excavation metrics and recommendations
- `excavation_log.txt` — `git diff --stat`

## Expedition Order (Fixed)

The expeditions MUST run in this order due to stratigraphic dependencies:

1. Site Survey & Baseline
2. Dead Code Excavation
3. Legacy Stratum Removal
4. Circular Dependency Cartography
5. Type Catalog Consolidation
6. Type Restoration & Hardening
7. DRY Stratification
8. Error Handling Stratigraphy
9. Artifact Cleaning & Documentation
10. Site Preservation & Final Catalog

**Why this order?** You cannot consolidate types before removing dead code (you might catalog code that should be discarded). You cannot DRY before untangling cycles (abstractions over cyclic deps create worse stratification).

## Language-Specific Tooling

| Language | Dead Code | Dependencies | Types | DRY |
|----------|-----------|--------------|-------|-----|
| TypeScript | `knip`, `unimported` | `madge` | `tsc` | `jscpd` |
| JavaScript | `knip`, `depcheck` | `madge` | N/A | `jscpd` |
| Python | `vulture` | `pydeps` | `mypy` | `pylint` |
| Go | `deadcode`, `staticcheck` | `godepgraph` | `go vet` | `golangci-lint` |
| Rust | `cargo-udeps`, `rustc` | `cargo-deps` | `rustc` | `clippy` |

If tools are missing, the skill falls back to AST-based manual analysis.

## Architecture

```
Code-Archaeology/
├── src/              # TypeScript source (plugin entry, types)
├── plugins/          # OpenCode plugin entry point
├── skills/           # Agent skill definitions (SKILL.md)
├── commands/         # CLI command documentation
├── hooks/            # Shell scripts for expedition workflow
├── prompts/          # Detailed expedition prompts
├── schema/           # JSON schemas for reports
├── AGENTS.md         # Agent runtime guide
└── README.md         # This file
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run typecheck

# Verify package
npm run verify:pack
```

## License

MIT
