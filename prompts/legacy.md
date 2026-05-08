# Expedition 2: Legacy Stratum Removal

## Objective
Identify and catalog legacy code patterns: deprecated APIs, polyfills, compatibility shims, and fallback code for outdated environments.

## Instructions

1. **Pattern Search**
   Search for these patterns across the codebase:
   - `@deprecated` annotations or JSDoc tags
   - `TODO(legacy)` or similar markers
   - `polyfill`, `shim`, `compat`, `fallback` in filenames or code
   - Feature detection for obsolete browsers/environments
   - Version checks for long-EOL dependencies

2. **Context Analysis**
   For each legacy artifact found:
   - Determine when it was added (git blame if possible)
   - Identify what modern replacement exists
   - Assess if any active code still depends on it
   - Check if tests specifically cover the legacy path

3. **Risk Assessment**
   - HIGH confidence: Marked deprecated, no internal references, modern replacement available
   - MEDIUM confidence: Legacy pattern but may have edge-case consumers
   - LOW confidence: Unclear if removal would break downstream consumers

## Output

Write to `.archaeology/expedition2-report.md`:
- Inventory of all legacy artifacts with location and context
- Classification by confidence level
- Recommended replacement for each artifact
- Migration path for consumers (if applicable)

## Execution Rules
- If `mode == survey`: catalog only
- If `mode == excavate`: generate migration guide + mock patches
- If `mode == restore`:
  - Remove HIGH confidence legacy code
  - Remove MEDIUM confidence only if `strict_mode == true`
  - Update documentation to reflect removals
  - Run tests after each batch
- If `mode == yolo`:
  - Same as restore with `strict_mode == true`

## Constraints
- NEVER remove polyfills for features still needed by supported environments
- NEVER remove fallback code for external APIs that are still unstable
- ALWAYS verify no active imports before removing deprecated exports
- NEVER break public API without explicit deprecation period documentation
