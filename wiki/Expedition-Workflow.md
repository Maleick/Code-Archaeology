# Expedition Workflow

[Home](Home) | [Installation](Installation) | [Security](Security-and-Safety) | [Release](Release-Process)

Code Archaeology runs phases in a fixed order so later changes are based on earlier evidence. In OpenCode, `/code-archaeology` runs the full 10-phase survey chain by default without per-phase prompts.

1. Site Survey & Baseline
2. Dead Code Excavation
3. Legacy Stratum Removal
4. Circular Dependency Cartography
5. Type Catalog Consolidation
6. Type Restoration & Hardening
7. DRY Stratification
8. Error Handling Stratigraphy
9. Artifact Cleaning & Documentation
10. Site Preservation & Final Catalog

## Modes

| Mode | Behavior |
| --- | --- |
| `survey` | Reports only; no source edits. |
| `excavate` | Reports plus mock patches in `.archaeology/patches/`. |
| `restore` | Applies approved changes with verification gates. |
| `yolo` | Unattended restore; applies HIGH + MEDIUM confidence findings with `strict_mode` enabled. |

Use `/code-archaeology-restore` explicitly for reviewed changes or `/code-archaeology --yolo` for one-shot unattended restoration. The default `/code-archaeology` command remains survey-only and writes reports under `.archaeology/`.

## Local Artifacts

`.archaeology/` contains `session.json`, `site_survey.md`, expedition reports, `FINAL_CATALOG.md`, `excavation_log.txt`, and optional mock patches. It is local runtime state and should not be committed.

## Gates

`hooks/opencode/init.sh` initializes the session. `verify-phase.sh` runs tests and type checks between restore phases. `revert-phase.sh` reverts a failed restore phase. `update-expedition.sh` records progress.
