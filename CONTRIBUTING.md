# Contributing

Thanks for improving Code Archaeology, an OpenCode plugin for systematic codebase excavation, cataloging, and restoration.

## Local Setup

```bash
npm install
npm run build
npm test
```

Use Node 20 for CI parity. Node 18 or newer is supported by the package metadata.

## Branch Policy

- Do not commit directly to `main` or `master`.
- Use a focused branch or worktree for each change.
- Keep `.archaeology/`, `.superpowers/`, `node_modules/`, logs, secrets, and editor state out of commits.
- Do not commit, tag, push, or publish release artifacts unless you are intentionally performing a reviewed release step.

## PR Checklist

- Keep `dist/` checked in only when runtime or source output changes; `dist/` is part of the published package surface and must reflect shipped behavior.
- Add `dist/` updates in the same PR for source changes (for example: `src/`, `commands/`, `prompts/`, hooks, or `scripts/` changes).
- Do not add or track `disk/`; it is runtime scratch space and belongs in `.gitignore`.
- If a change is docs-only (`README`, `INSTALL`, `docs/`, `wiki/`), `dist/` updates are not required.

## Testing Commands

Run the most focused checks for your change, and run the release checks before release-impacting changes are merged:

```bash
npm run build
npm run typecheck
npm test
npm audit --audit-level=moderate
bash -n hooks/opencode/*.sh
npm pack --json --dry-run
```

If a restore-mode change modifies behavior, verify it against a disposable repository or fixture and document the result.

Before committing, pushing, or opening a PR, run a polish pass over the changed surface. Check wording, links, visuals, accessibility, package contents, and whether the repository presentation still looks complete.

## Documentation Expectations

- Update `README.md`, `INSTALL.md`, `docs/`, or `wiki/` when installation, commands, workflow, safety, or release behavior changes.
- Keep documentation factual, concise, and ASCII.
- Do not include secrets, credentials, private repository contents, or full local runtime state.
- Preserve the safety model: survey first, excavate for mock patches, restore only after review.

## Release Notes Expectations

- Add user-visible changes to `CHANGELOG.md`.
- Mention install or CLI changes, safety changes, package metadata changes, and migration steps when relevant.
- Do not claim a GitHub release, npm publish, tag, or Pages update happened until it has been verified.
