---
name: code-archaeology-excavate
description: Run Code Archaeology in excavate mode — generate reports and mock patches for human review
trigger:
  - "archaeology excavate"
  - "code archaeology excavate"
  - "/archaeology-excavate"
---

# Code Archaeology — Excavate Mode

Generate reports AND mock patch files for human review. Still zero actual file changes — this produces the patches you would apply.

## Usage

```
Run: /code-archaeology-excavate
```

## What It Does

Runs all 10 expeditions in excavate mode:
- Catalogs every artifact found (same as survey)
- Generates mock `.patch` files showing proposed changes
- Labels each patch with confidence level (HIGH/MEDIUM/LOW)
- Proposes specific line-by-line changes
- Does NOT apply any patches

## When to Use

- After survey reports show promising findings
- Team wants to review exact changes before applying
- Need to estimate review effort
- Want to batch-review multiple expeditions

## Output

- All survey reports in `.archaeology/`
- Mock patch files in `.archaeology/patches/`
- Patch index in `.archaeology/patch-index.json`

## Review Process

1. Read `expeditionN-report.md` files
2. Review `.archaeology/patches/*.patch` files
3. Approve/reject individual patches
4. Run `/code-archaeology-restore` to apply approved patches

## Parameters

Same as `/code-archaeology`, defaults to `mode: excavate`.
