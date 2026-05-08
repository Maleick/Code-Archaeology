# Expedition 4: Type Catalog Consolidation

## Objective
Consolidate duplicate or redundant type definitions. Remove type definitions for code that was removed in previous expeditions.

## Instructions

1. **Type Discovery**
   - Scan for duplicate interface/type definitions
   - Find types defined in multiple files with same or similar shapes
   - Identify types that shadow or extend each other unnecessarily
   - Catalog type definitions for dead code removed in Expedition 1

2. **Deduplication Analysis**
   For each duplicate cluster:
   - Compare structural similarity (are they actually the same?)
   - Check usage patterns (which variant is more widely used?)
   - Assess if they diverge intentionally (business logic differences)
   - Determine canonical location (shared types directory, domain module, etc.)

3. **Migration Planning**
   - Plan imports to redirect to canonical type
   - Identify if any type refinements are needed during consolidation
   - Flag types that should merge vs. types that should remain separate

## Output

Write to `.archaeology/expedition4-report.md`:
- Catalog of duplicate type clusters
- Consolidation plan for each cluster
- File paths affected by migration
- Types flagged for human review (uncertain merges)

## Execution Rules
- If `mode == survey`: catalog only
- If `mode == excavate`: generate type migration maps
- If `mode == restore`:
  - Consolidate HIGH confidence duplicates
  - Update all imports to point to canonical definitions
  - Remove orphaned type definitions
  - Run type checker after each consolidation batch
- If `mode == yolo`:
  - Same as restore with `strict_mode == true`

## Constraints
- NEVER merge types that have semantic differences (even if structurally similar)
- NEVER guess at the correct merged type—flag for review if uncertain
- ALWAYS run the type checker after changes—zero errors before proceeding
- ALWAYS preserve JSDoc comments on types during migration
- NEVER consolidate before dead code removal is complete (prevents cataloging discarded code)
