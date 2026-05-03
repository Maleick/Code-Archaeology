# Release Process

This checklist is for future `opencode-code-archaeology` releases. `v2.0.2` is the current release example; replace it with the next version when preparing a new release.

## 1. Preflight

- Work from the release readiness branch or a dedicated release worktree.
- Confirm the worktree has no unrelated changes you intend to publish accidentally.
- Confirm no secrets or local runtime state are staged.
- Review `README.md`, `INSTALL.md`, `docs/`, `wiki/`, `CHANGELOG.md`, and package metadata for version-specific claims.
- Confirm `.archaeology/`, `.superpowers/`, `node_modules/`, and logs are ignored.

## 2. Version Bump

For a future release, replace `2.0.2` with the target version:

```bash
npm version 2.0.2 --no-git-tag-version
```

Update `VERSION` to the same value:

```text
2.0.2
```

Confirm `package.json`, `package-lock.json`, and `VERSION` agree.

## 3. Changelog

- Add a `v2.0.2` entry, or the future target version, to `CHANGELOG.md`.
- Include user-visible changes, safety notes, and any migration instructions.
- Keep the release notes factual and avoid claiming publication steps that have not happened yet.

## 4. Verification

Run focused release checks before committing:

```bash
npm install
npm run build
npm run typecheck
npm audit --audit-level=moderate
npm outdated --json
bash -n hooks/opencode/*.sh
bash -n hooks/hermes/*.sh
npm pack --json --dry-run
```

Expected outcomes:

- Build and typecheck pass.
- npm audit reports no moderate-or-higher vulnerabilities.
- npm outdated reports `{}` or no actionable outdated dependencies.
- Shell hooks pass syntax checks (both OpenCode and Hermes).
- The package dry run includes required files.

## 5. npm Pack Required Files

Inspect `npm pack --json --dry-run` output for the package contents. Required files should include:

- `dist/`
- `assets/`
- `hooks/`
- `commands/`
- `skills/`
- `plugins/`
- `schema/`
- `prompts/`
- `docs/`
- `wiki/`
- `AGENTS.md`
- `VERSION`
- `INSTALL.md`
- `README.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `LICENSE`

If any required file is missing, update the `files` array in `package.json`, rerun `npm install` if the lockfile needs to change, and repeat the package dry run.

## 6. Commit, Tag, And Push

Only perform these steps after verification passes and after confirming the branch is safe to publish:

```bash
git status --short
git add README.md INSTALL.md docs wiki assets .github SECURITY.md CONTRIBUTING.md CHANGELOG.md package.json package-lock.json VERSION .gitignore
git commit -m "chore: prepare v2.0.2 release"
git tag v2.0.2
git push origin HEAD
git push origin v2.0.2
```

For a future release, use the future version in the commit message and tag.

## 7. GitHub Release

Create the GitHub release from the matching tag:

```bash
gh release create v2.0.2 --title "v2.0.2" --notes-file CHANGELOG.md
```

Before publishing, trim the notes to the specific version section if `CHANGELOG.md` contains multiple releases.

## 8. npm Publish

Publish only after the GitHub tag and release are correct:

```bash
npm publish --access public
```

If publishing fails, do not create a replacement tag unless the failure requires a new package version. Fix the issue, rerun verification, and follow npm versioning rules.

## 9. Final Checks

Confirm the public release surfaces report the expected version:

```bash
npm view opencode-code-archaeology version
npm view opencode-code-archaeology dist-tags
gh release view v2.0.2
```

Optionally verify a fresh install path:

```bash
npm install -g opencode-code-archaeology@latest
opencode-code-archaeology doctor
opencode-code-archaeology version
```

Do not claim GitHub Pages is enabled unless repository settings confirm it.
