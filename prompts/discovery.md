# Phase 0: Site Survey & Baseline

## Objective
Establish a complete inventory of the codebase before any modifications. Document the baseline state so all subsequent expeditions have a reference point.

## Instructions

1. **Verify Preconditions**
   - Confirm working tree is clean
   - Confirm tests pass at baseline
   - Create branch `{{ branch_name }}`
   - Create `.archaeology/` directory

2. **File Inventory**
   - Catalog all source files by directory
   - Note file counts, line counts, and language distribution
   - Identify configuration files (package.json, tsconfig, etc.)

3. **Dependency Mapping**
   - Document all external dependencies
   - Note devDependencies vs production dependencies
   - Flag any deprecated or outdated packages

4. **Baseline Metrics**
   - Record test count and coverage (if available)
   - Record type error count
   - Record lint error count
   - Save current git HEAD to `.archaeology/baseline.txt`

## Output

Write to `.archaeology/site_survey.md`:
- Executive summary of codebase size and structure
- Dependency health assessment
- Baseline metrics table
- Risk factors identified

Write to `.archaeology/artifact_inventory.json`:
- Machine-readable file inventory

Write to `.archaeology/stratum_graph.json`:
- Dependency graph data for visualization

## Constraints
- ZERO file modifications in this phase
- If tests fail at baseline, abort immediately
- Do not proceed to Expedition 1 until this report is complete
