---
name: code-archaeology-survey
description: Run Code Archaeology in survey mode — catalog artifacts only, zero file changes
trigger:
  - "archaeology survey"
  - "code archaeology survey"
  - "/archaeology-survey"
---

# Code Archaeology — Survey Mode

Generate site reports only. Zero file changes. Use this for initial audits and management review.

## Usage

```
Run: /code-archaeology-survey
```

## What It Does

Runs all 10 expeditions in survey mode:
- Catalogs every artifact found
- Generates `.archaeology/expeditionN-report.md` for each phase
- Produces `.archaeology/site_survey.md` baseline
- Produces `.archaeology/FINAL_CATALOG.md` summary
- Does NOT modify any source files

## When to Use

- First-time codebase audit
- Management wants a technical debt report
- Team is deciding whether to refactor
- You want to know the scope before committing resources

## Output

All reports in `.archaeology/`:
- `site_survey.md`
- `expedition1-report.md` through `expedition8-report.md`
- `FINAL_CATALOG.md`

## Next Steps

After reviewing reports:
1. Decide which findings to address
2. Run `/code-archaeology-excavate` to generate mock patches
3. Or run `/code-archaeology-restore` to apply high-confidence fixes
