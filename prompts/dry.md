# Expedition 6: DRY Stratification

## Objective
Identify semantic duplication across the codebase and extract shared abstractions. Only extract true semantic duplicates, not coincidental similarity.

## Instructions

1. **Duplicate Detection**
   - Run `jscpd` with `min_duplicate_lines: 5`
   - Search for repeated patterns manually (error messages, validation logic, API calls)
   - Look for copy-pasted code blocks with minor variations

2. **Semantic Analysis**
   For each duplicate found:
   - Determine if the duplication is coincidental (same structure, different semantics)
   - Check if the duplicated code represents a real domain concept
   - Assess if extraction would create a meaningful abstraction
   - Verify the duplicated code isn't better left inline (trivial one-liners)

3. **Extraction Planning**
   - Identify the canonical location for the extracted code
   - Determine the appropriate abstraction level (function, class, constant, etc.)
   - Plan parameterization for minor variations
   - Check for existing utility libraries that could host the code

## Output

Write to `.archaeology/expedition6-report.md`:
- Catalog of all duplications with locations and similarity scores
- Classification: semantic vs. coincidental
- Extraction recommendation for each semantic duplicate
- Proposed abstraction name and location
- Files affected by extraction

## Execution Rules
- If `mode == survey`: catalog only
- If `mode == excavate`: generate extraction plans with before/after code
- If `mode == restore`:
  - Extract HIGH confidence semantic duplications
  - Extract MEDIUM confidence only if `strict_mode == true`
  - NEVER extract coincidental similarities—leave them inline
  - Run tests after each extraction
- If `mode == yolo`:
  - Same as restore with `strict_mode == true`

## Constraints
- NEVER extract code into a "utils" grab bag—use domain-appropriate names
- NEVER create abstractions over cyclic dependencies (fix cycles in Expedition 3 first)
- ALWAYS ensure the extracted code is actually used in 3+ places or is likely to be
- NEVER change behavior during extraction—pure refactor only
- ALWAYS prefer composition over premature abstraction
