# Phase 9: Site Preservation & Final Catalog

## Objective
Verify all previous expeditions produced a healthy codebase. Generate final metrics and preserve the excavation record.

## Instructions

1. **Test Verification**
   - Run `{{ test_command }}` — must exit 0
   - Run `{{ typecheck_command }}` — must exit 0
   - If either fails, STOP and revert to baseline

2. **Regression Checks**
   - Re-run dependency analysis—verify no NEW cycles introduced
   - Re-run dead code analysis—verify no NEW dead code created
   - Check that no types were weakened during previous expeditions
   - Verify no new duplications were introduced

3. **Metrics Collection**
   - Calculate lines changed (added/removed)
   - Calculate test coverage delta (if available)
   - Count type errors resolved
   - Count cycles broken
   - Count dead code removed

4. **Diff Preservation**
   - Run `git diff --stat > .archaeology/excavation_log.txt`
   - Capture the complete change summary

## Output

Write to `.archaeology/FINAL_CATALOG.md`:
- Executive summary of all expeditions
- Before/after metrics comparison table
- List of all artifacts removed
- List of all types consolidated
- List of all cycles broken
- Recommendations for future maintenance
- Human review sign-off checklist (if mode != survey)

Write to `.archaeology/excavation_log.txt`:
- Complete `git diff --stat` output

## Final Checks
- [ ] All tests passing
- [ ] Type checker zero errors
- [ ] No new circular dependencies
- [ ] No new dead code
- [ ] Linting passes (if applicable)
- [ ] Documentation updated
- [ ] Human review completed (if mode != survey)

## Constraints
- NEVER claim success if any test fails
- NEVER ignore new type errors introduced during expeditions
- ALWAYS revert all changes if this phase fails—do not leave repo in broken state
- ALWAYS preserve `.archaeology/` directory for historical record
- NEVER delete `.archaeology/` reports even after successful completion
