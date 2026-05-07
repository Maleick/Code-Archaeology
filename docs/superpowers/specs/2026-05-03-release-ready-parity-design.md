# Release-Ready Parity Design

**Goal:** Bring Code Archaeology up to the public repository, security, install, and release standard used by AutoShip and AutoResearch, then publish a new coherent GitHub and npm release.

**Approved Scope:** Release-ready parity, not a full custom marketing site. The repository should look complete, install cleanly through OpenCode and npm, expose a GitHub Pages-ready documentation tree, and provide source pages that can populate the GitHub Wiki.

## Current State

- `npm audit --json` reports zero vulnerabilities.
- `npm outdated --json` reports no outdated packages.
- GitHub has release `v2.0.1`; npm currently publishes `opencode-code-archaeology@2.0.0`.
- `package.json` is `2.0.1`, `VERSION` is `2.0.1`, and `package-lock.json` still records `2.0.0`.
- README is functional but less complete than AutoShip/AutoResearch: no banner, limited badges, no Mermaid diagrams, no centered navigation, no docs/wiki links.
- The repository has no `INSTALL.md`, `docs/`, `wiki/`, `assets/`, `.github/`, `SECURITY.md`, `CONTRIBUTING.md`, or `CHANGELOG.md`.
- GitHub repository metadata is incomplete: description, homepage, and topics are empty.

## Target Release

Release `v2.0.2` instead of reusing `v2.0.1`. This keeps GitHub and npm monotonic because GitHub already has `v2.0.1` while npm is still at `2.0.0`.

## Repository Surface

The README should follow the pattern proven by AutoShip and AutoResearch:

- SVG banner from `assets/code-archaeology-banner.svg`.
- Shield row for stars, last commit, release version, license, npm version, docs, and sponsor.
- Centered navigation for install, docs, wiki, commands, safety, and release sections.
- Short product statement with an ASCII capability panel.
- Installation path that prioritizes a raw `INSTALL.md` instruction block for OpenCode users and npm install commands for CLI/package users.
- Mermaid workflow diagrams for expedition flow and safety gates.
- Commands, architecture, runtime artifacts, local testing, and release links.

## Install Surface

Root `INSTALL.md` should mirror the Superpowers install-hand-off style:

```text
Fetch and follow instructions from the versioned INSTALL.md shipped with opencode-code-archaeology@2.2.0 by opening https://unpkg.com/opencode-code-archaeology@2.2.0/INSTALL.md
```

The document should include:

- OpenCode plugin installation using the current OpenCode `opencode.json` `plugin` array.
- npm global install path using a pinned package version, such as `npm install -g opencode-code-archaeology@2.2.0`, when the published package exposes a CLI.
- Verification commands that do not require secrets.
- Troubleshooting notes for plugin loading, package cache, and command discovery.

## Package Surface

The package should ship all user-facing repository assets needed for npm and GitHub installs:

- `dist`, `hooks`, `commands`, `skills`, `plugins`, `prompts`, `schema`, `docs`, `wiki`, `assets`, `INSTALL.md`, `AGENTS.md`, `VERSION`, `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `LICENSE`.
- Package metadata should include author, homepage, repository, bugs, keywords, and npm package details.
- Version files should all agree on `2.0.2`.
- The lockfile should be regenerated or updated so root package metadata matches `package.json`.

## Documentation Surface

Create a small GitHub Pages-ready `docs/` tree:

- `docs/README.md`: landing page and docs index.
- `docs/INSTALL.md`: install details linked from README.
- `docs/ARCHITECTURE.md`: plugin layout, expedition flow, and artifact lifecycle.
- `docs/RELEASE.md`: exact release checklist for future versions.
- `docs/SECURITY_AUDIT.md`: audit checklist and current audit result.

Create `wiki/` source pages that can be pushed to GitHub Wiki:

- `wiki/Home.md`
- `wiki/Installation.md`
- `wiki/Expedition-Workflow.md`
- `wiki/Security-and-Safety.md`
- `wiki/Release-Process.md`

## GitHub Surface

Add baseline community and automation files:

- `.github/workflows/ci.yml` for build, typecheck, audit, shell syntax, and package dry-run.
- `.github/ISSUE_TEMPLATE/bug_report.yml` and `.github/ISSUE_TEMPLATE/feature_request.yml`.
- `.github/pull_request_template.md`.
- `SECURITY.md` and `CONTRIBUTING.md`.

Use `gh repo edit` after commit to set:

- Description: `Systematic codebase excavation plugin for OpenCode: survey technical debt, generate reports, and restore architecture with test-gated safety.`
- Homepage: `https://github.com/Maleick/Code-Archaeology#readme` unless GitHub Pages is enabled later.
- Topics: `opencode`, `plugin`, `static-analysis`, `code-quality`, `technical-debt`, `refactoring`, `automation`, `developer-tools`, `typescript`, `security`.

GitHub Pages may require repository settings and should be enabled from `main` `/docs` if the API permits it. If Pages cannot be enabled non-interactively, leave the `docs/` tree ready and report the manual action.

## Security Review

The release audit should check:

- No hardcoded secrets or credential files.
- `.archaeology/`, `.superpowers/`, `node_modules/`, and generated coverage remain ignored.
- Shell hooks pass `bash -n`.
- `npm audit --audit-level=moderate` passes.
- `npm outdated --json` is empty or documented.
- Package dry run includes required files and excludes local state.
- Release commands do not print tokens or read secret files.

Known safety concern to keep documented: `hooks/opencode/revert-phase.sh` intentionally contains destructive recovery commands for target repositories. This is product behavior, not a release task to change here; docs must keep warning users that restore mode is branch-isolated and test-gated.

## Verification

Before committing and publishing:

- `npm install`
- `npm run build`
- `npm run typecheck`
- `npm audit --audit-level=moderate`
- `npm outdated --json`
- `bash -n hooks/opencode/*.sh`
- `npm pack --json --dry-run` with required-file validation

Before claiming release complete:

- Commit release-ready changes.
- Push `main` if required for GitHub release.
- Create tag and GitHub release `v2.0.2`.
- Publish `opencode-code-archaeology@2.0.2` to npm if npm auth is available.
- Confirm `gh release view v2.0.2` and `npm view opencode-code-archaeology@2.0.2 version` agree.

## Out Of Scope

- Major runtime behavior changes.
- Replacing the current OpenCode plugin contract.
- Building a custom hosted documentation site beyond a GitHub Pages-ready `/docs` tree.
- Rewriting the archaeology workflow or expedition order.

## Self-Review

- Placeholder scan: no placeholders or deferred requirements remain.
- Internal consistency: target version is `2.0.2` across package, release, and docs.
- Scope check: one cohesive repository/release readiness project; no runtime feature work is included.
- Ambiguity check: GitHub Pages enablement may depend on repository API permissions and is explicitly treated as best-effort.
