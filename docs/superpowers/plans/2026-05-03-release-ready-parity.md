# Release-Ready Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Code Archaeology to release-ready repository parity with AutoShip and AutoResearch, then publish `v2.0.2` to GitHub and npm.

**Architecture:** This is a repository surface and release-readiness update. It adds static docs, install guidance, GitHub community files, an SVG banner, package metadata fixes, and a reproducible release checklist without changing plugin runtime behavior.

**Tech Stack:** OpenCode plugin, TypeScript ESM package, npm, GitHub Releases, GitHub Pages-ready Markdown docs, GitHub Actions.

---

### Task 1: Add Public Repository Surface

**Files:**
- Create: `assets/code-archaeology-banner.svg`
- Modify: `README.md`
- Create: `INSTALL.md`

- [ ] **Step 1: Add the SVG banner**

Create `assets/code-archaeology-banner.svg` with a dark, archaeology-themed OpenCode plugin banner.

- [ ] **Step 2: Rewrite README with release-ready structure**

Update `README.md` to include banner, shields, navigation, installation, Mermaid diagrams, command tables, architecture, safety, testing, release, and runtime artifact sections.

- [ ] **Step 3: Add root install hand-off**

Create `INSTALL.md` with the OpenCode prompt line, plugin-array install instructions, npm install path, verification, update, and troubleshooting notes.

### Task 2: Add Docs And Wiki Source

**Files:**
- Create: `docs/README.md`
- Create: `docs/INSTALL.md`
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/RELEASE.md`
- Create: `docs/SECURITY_AUDIT.md`
- Create: `wiki/Home.md`
- Create: `wiki/Installation.md`
- Create: `wiki/Expedition-Workflow.md`
- Create: `wiki/Security-and-Safety.md`
- Create: `wiki/Release-Process.md`

- [ ] **Step 1: Add documentation landing pages**

Create the docs tree with install, architecture, release, and security audit pages.

- [ ] **Step 2: Add wiki source pages**

Create the wiki tree so maintainers can push these pages into the GitHub Wiki.

### Task 3: Add Community And CI Files

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/pull_request_template.md`
- Create: `SECURITY.md`
- Create: `CONTRIBUTING.md`
- Create: `CHANGELOG.md`

- [ ] **Step 1: Add CI workflow**

Create a Node 20 GitHub Actions workflow that runs install, build, typecheck, audit, shell syntax, and package dry run.

- [ ] **Step 2: Add community docs**

Add issue templates, PR template, security policy, contribution guide, and changelog entry for `v2.0.2`.

### Task 4: Fix Package And Release Metadata

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `VERSION`
- Modify: `.gitignore`

- [ ] **Step 1: Bump version files to 2.0.2**

Run `npm version 2.0.2 --no-git-tag-version` and update `VERSION` to `2.0.2`.

- [ ] **Step 2: Include docs assets in npm package**

Update package `files` so npm ships docs, wiki source, assets, install, security, contributing, changelog, prompts, and schema.

- [ ] **Step 3: Ignore visual companion state**

Ensure `.superpowers/` is ignored.

### Task 5: Verify Release Readiness

**Files:**
- No source edits expected unless verification exposes a blocker.

- [ ] **Step 1: Run package install**

Run `npm install` and confirm lockfile consistency.

- [ ] **Step 2: Run build and typecheck**

Run `npm run build` and `npm run typecheck`.

- [ ] **Step 3: Run security and freshness checks**

Run `npm audit --audit-level=moderate` and `npm outdated --json`.

- [ ] **Step 4: Run shell syntax checks**

Run `bash -n hooks/opencode/*.sh`.

- [ ] **Step 5: Run package dry-run validation**

Run `npm pack --json --dry-run` and verify required files exist in the package.

### Task 6: Publish Release

**Files:**
- Git metadata and remote release artifacts.

- [ ] **Step 1: Commit release-ready changes**

Commit the verified repository updates with a concise release-readiness message.

- [ ] **Step 2: Push and tag**

Push `main`, create tag `v2.0.2`, and push the tag.

- [ ] **Step 3: Create GitHub release**

Create `v2.0.2` from the changelog notes.

- [ ] **Step 4: Publish npm package**

Run `npm publish --access public` if npm auth is available.

- [ ] **Step 5: Update repository metadata**

Use `gh repo edit` to set description, homepage, and topics. Enable Pages from `/docs` if API permissions allow it.

- [ ] **Step 6: Final release checks**

Confirm GitHub release and npm package report `2.0.2`.
