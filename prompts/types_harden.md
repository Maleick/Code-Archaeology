# Expedition 5: Type Restoration & Hardening

## Objective
Replace weak types (`any`, `unknown`, `Object`, `Function`) with precise types. Strengthen interfaces and add missing type constraints.

## Instructions

1. **Weak Type Scan**
   Search for these patterns:
   - Explicit `any` annotations
   - `unknown` used where a specific type is inferable
   - `Object` or `{}` as parameter/return types
   - `Function` type (use specific call signatures instead)
   - Missing return type annotations on exported functions
   - `map[string]interface{}` (Go) or equivalent weak structures

2. **Type Inference**
   For each weak type found:
   - Examine usage patterns to infer the correct type
   - Check test files for type expectations
   - Look at how the value is destructured or accessed
   - Consider if a branded type or discriminated union is appropriate

3. **Confidence Assessment**
   - HIGH: Usage clearly indicates specific type, tests confirm
   - MEDIUM: Type is inferable but has some dynamic access
   - LOW: Too many possible shapes, requires domain knowledge

## Output

Write to `.archaeology/expedition5-report.md`:
- Inventory of all weak types with locations
- Proposed replacement type for each
- Confidence level per replacement
- Files that would be affected by changes

## Execution Rules
- If `mode == survey`: catalog only
- If `mode == excavate`: generate type patch proposals
- If `mode == restore`:
  - Replace HIGH confidence weak types
  - Replace MEDIUM confidence only if `strict_mode == true`
  - NEVER replace LOW confidence types—flag for human review
  - Run type checker after each file—stop on errors

## Constraints
- NEVER use `any` to "fix" a complex type—use proper typing
- NEVER remove necessary `unknown` types (e.g., from external APIs)
- NEVER change runtime behavior when adding types—types only
- ALWAYS verify type checker passes with zero errors before proceeding
- NEVER guess types for external library internals—use their type definitions
