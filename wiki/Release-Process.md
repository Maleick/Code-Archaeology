# Release Process

[Home](Home) | [Installation](Installation) | [Workflow](Expedition-Workflow) | [Security](Security-and-Safety)

Use this checklist for future `opencode-code-archaeology` releases. `v2.1.0` is the current example version; replace it with the target version.

## Checklist

1. Review the worktree for unrelated changes and local state.
2. Bump package files with `npm version 2.1.0 --no-git-tag-version`.
3. Update `VERSION` to `2.1.0`.
4. Update `CHANGELOG.md` with release notes.
5. Run verification:

```bash
npm install
npm run build
npm run typecheck
npm audit --audit-level=moderate
npm outdated --json
bash -n hooks/opencode/*.sh
npm pack --json --dry-run
```

6. Confirm the package dry run includes `dist`, `assets`, `hooks`, `commands`, `skills`, `plugins`, `schema`, `prompts`, `docs`, `wiki`, `README.md`, `INSTALL.md`, `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTING.md`, `VERSION`, `AGENTS.md`, and `LICENSE`.
7. Commit release files, tag `v2.1.0`, push the branch, and push the tag.
8. Create the GitHub release from the tag.
9. Publish npm with `npm publish --access public`.
10. Confirm `npm view opencode-code-archaeology version` and `gh release view v2.1.0` show the expected release.

Do not claim GitHub Pages is enabled unless repository settings confirm it.
