## Summary

- 

## Verification

- [ ] Polish pass completed before commit, push, and PR.
- [ ] `npm run build`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm audit --audit-level=moderate`
- [ ] `bash -n hooks/opencode/*.sh`
- [ ] `npm pack --json --dry-run`

## Safety Checklist

- [ ] I did not commit `.archaeology/`, `.superpowers/`, secrets, logs, or local editor state.
- [ ] Restore-mode changes are backed by reviewed survey or excavate output.
- [ ] I did not remove try/catch around I/O or external input boundaries.
- [ ] I flagged uncertain type or behavior changes for review instead of guessing.

## Docs And Release Checklist

- [ ] README, INSTALL, docs, and wiki source are updated if user behavior changed.
- [ ] CHANGELOG includes user-visible changes.
- [ ] Package metadata and npm package contents are correct for release-impacting changes.
- [ ] Version, tag, publish, and release steps are not included unless this PR is the release PR.
