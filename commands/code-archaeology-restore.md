---
name: code-archaeology-restore
description: Run Code Archaeology in restore mode — execute approved changes after survey/excavate review
trigger:
  - "archaeology restore"
  - "code archaeology restore"
  - "/archaeology-restore"
---

# Code Archaeology — Restore Mode

Execute approved changes. Applies HIGH confidence findings by default. With `strict_mode: true`, also applies MEDIUM confidence findings.

## Usage

```
Run: /code-archaeology-restore
```

## What It Does

Runs all 10 expeditions in restore mode:
- Applies HIGH confidence changes automatically
- Applies MEDIUM confidence changes only if `strict_mode: true`
- NEVER applies LOW confidence changes (flagged for manual review)
- Runs tests after each expedition phase
- Reverts immediately if tests fail
- Generates final report with metrics

## When to Use

- Survey and excavate phases are complete
- Team has reviewed and approved findings
- You want automated cleanup of obvious issues
- You have good test coverage to catch regressions

## Safety

- Creates `refactor/archaeology` branch (configurable)
- Tests run between every phase
- Automatic revert on test failure
- LOW confidence findings never auto-applied
- I/O boundary error handling never removed

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `strict_mode` | `false` | If `true`, also applies MEDIUM confidence findings |

## Output

- Applied changes on `refactor/archaeology` branch
- `FINAL_CATALOG.md` with before/after metrics
- `excavation_log.txt` with `git diff --stat`

## Next Steps

1. Review the branch: `git diff main..refactor/archaeology`
2. Run full test suite
3. Create PR for team review
4. Merge when approved
