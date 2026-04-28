# Expedition 8: Artifact Cleaning & Documentation

## Objective
Final cleanup pass: remove unnecessary comments, fix formatting, update documentation, and remove any remaining slop accumulated during previous expeditions.

## Instructions

1. **Documentation Audit**
   - Remove outdated JSDoc comments (references to removed parameters, old behavior)
   - Update README files to reflect removed features or changed APIs
   - Remove boilerplate comments that state the obvious
   - Ensure all public APIs have accurate documentation

2. **Code Cleanup**
   - Remove debug console.log statements
   - Remove commented-out code blocks (if not already removed in Expedition 1)
   - Fix inconsistent formatting (trailing whitespace, mixed indentation)
   - Remove unused imports (if not caught by Expedition 1)

3. **Slop Detection**
   - Look for defensive programming that is no longer needed
   - Remove type assertions that are now properly typed (from Expedition 5)
   - Clean up temporary variables used during previous expeditions
   - Verify no TODO comments were left unresolved

## Output

Write to `.archaeology/expedition8-report.md`:
- Summary of all cleanup actions taken
- Documentation updates made
- Files modified in this expedition
- Remaining slop flagged for human review (if any)

## Execution Rules
- If `mode == survey`: catalog only
- If `mode == excavate`: generate cleanup patch
- If `mode == restore`:
  - Perform all safe cleanup actions
  - NEVER remove meaningful comments explaining complex logic
  - NEVER change code semantics during cleanup
  - Run tests after cleanup

## Constraints
- NEVER remove comments explaining WHY (only remove WHAT comments that state the obvious)
- NEVER change formatting in files that weren't otherwise modified (noise in diff)
- ALWAYS preserve license headers and legal comments
- NEVER remove TODO comments that are still valid—move them to issue tracker instead
- ALWAYS run linter/formatter after cleanup if available
