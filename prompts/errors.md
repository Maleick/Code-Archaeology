# Expedition 7: Error Handling Stratigraphy

## Objective
Identify and catalog problematic error handling patterns: suppressed errors, empty catch blocks, overly broad try/catch, and error swallowing.

## Instructions

1. **Pattern Search**
   Search for these anti-patterns:
   - Empty or console-only catch blocks
   - `catch (e) { return null; }` or similar suppression
   - `try/catch` around non-throwing code (defensive overprogramming)
   - Broad exception types when specific ones are available
   - `suppress`, `silence`, `safe`, `onError` in function names (often indicate error hiding)
   - Ignored Promise rejections (`.catch(() => {})`)

2. **Context Analysis**
   For each finding:
   - Determine if the suppression is intentional (expected failure case)
   - Identify what error information is being lost
   - Assess if the error should propagate to a higher handler
   - Check if logging/monitoring is adequate

3. **Boundary Classification**
   - I/O boundary: File system, network, external API calls (legitimate try/catch)
   - Internal boundary: Business logic, pure functions (suspicious suppression)
   - User input boundary: Form validation, CLI arguments (may need specific handling)

## Output

Write to `.archaeology/expedition7-report.md`:
- Inventory of all error handling issues with locations
- Classification by anti-pattern type
- Risk assessment (data loss, silent failures, debugging difficulty)
- Recommended fix for each issue
- Boundary classification for each finding

## Execution Rules
- If `mode == survey`: catalog only
- If `mode == excavate`: generate fix proposals
- If `mode == restore`:
  - Remove error hiding from internal boundaries
  - Add proper logging or propagation
  - NEVER remove try/catch from I/O or external input boundaries
  - Run tests after each change

## Constraints
- NEVER remove try/catch from I/O operations (file read, network request, DB query)
- NEVER remove try/catch from external API boundaries
- ALWAYS preserve error information—replace suppression with logging or re-throwing
- NEVER let errors propagate unhandled—replace with explicit error handling
- ALWAYS consider if the catch block is testing an expected condition (if so, refactor to validation)
