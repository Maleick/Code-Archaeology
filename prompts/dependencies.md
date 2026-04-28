# Expedition 3: Circular Dependency Cartography

## Objective
Map all circular dependencies in the module graph and provide remediation strategies.

## Instructions

1. **Tool-Based Analysis**
   - Run `madge --circular` (TypeScript/JavaScript)
   - Run `pydeps` (Python) or equivalent
   - If tools unavailable, build import graph manually

2. **Dependency Mapping**
   For each cycle found:
   - List all files in the cycle
   - Identify the specific imports creating the cycle
   - Determine if the cycle is direct (A→B→A) or indirect (A→B→C→A)
   - Calculate cycle complexity (number of nodes, edges)

3. **Remediation Strategy**
   For each cycle, determine the best fix:
   - Extract shared code to a new module (preferred)
   - Use dependency inversion / interfaces
   - Move code to break the cycle
   - Convert to dynamic imports (if appropriate)
   - Flag as architectural issue requiring human design review

## Output

Write to `.archaeology/expedition3-report.md`:
- Complete cycle inventory with file paths and import chains
- Visualization data (can be rendered with graphviz)
- Remediation recommendation per cycle
- Estimated effort to resolve each cycle

## Execution Rules
- If `mode == survey`: catalog only
- If `mode == excavate`: generate detailed migration plans
- If `mode == restore`:
  - Fix simple cycles (2-node, clear extraction path) automatically
  - Flag complex cycles for human review
  - NEVER create new abstractions that obscure the cycle—break it properly
  - Run tests after each fix

## Constraints
- NEVER introduce dynamic imports just to hide a cycle—fix the architecture
- NEVER extract code into poorly-named "utils" files—use domain-appropriate names
- ALWAYS ensure the fixed graph has no new cycles introduced
- ALWAYS verify the cycle is real (not a type-only import that tree-shakes away)
