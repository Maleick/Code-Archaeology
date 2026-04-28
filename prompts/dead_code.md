# Expedition 1: Dead Code Excavation

## Objective
Identify and catalog all dead code—unused exports, unreachable functions, unreferenced variables, and orphaned files.

## Instructions

1. **Tool-Based Discovery**
   - Run `knip` (TypeScript/JavaScript) or `vulture` (Python)
   - Run `jscpd` to find duplicate code that may indicate dead copies
   - If tools unavailable, perform AST-based manual analysis

2. **Classification**
   For each finding, classify confidence:
   - **HIGH**: Tool-confirmed unused export with zero references
   - **MEDIUM**: Likely unused but has dynamic access or test references
   - **LOW**: Possibly used via reflection or build-time injection

3. **Impact Assessment**
   - Note if removal affects public API
   - Check for test files that import but don't meaningfully test
   - Verify no build scripts or CI depend on the code

## Output

Write to `.archaeology/expedition1-report.md`:
- Table of all findings with file paths, line numbers, confidence levels
- Categorized by type (unused export, unreachable code, orphaned file, duplicate)
- Recommended action per finding (remove, flag for review, keep)
- Estimated lines of code affected

## Execution Rules
- If `mode == survey`: catalog only, zero changes
- If `mode == excavate`: generate mock patch files for review
- If `mode == restore`:
  - Remove HIGH confidence artifacts always
  - Remove MEDIUM confidence artifacts only if `strict_mode == true`
  - NEVER remove LOW confidence artifacts
  - Run tests after each removal batch
  - Revert immediately if tests fail

## Constraints
- NEVER remove code that is dynamically accessed (eval, require(variable), etc.)
- NEVER remove exports that are part of a public API unless explicitly deprecated
- ALWAYS verify with grep that no references exist before removing
