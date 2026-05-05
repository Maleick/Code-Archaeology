# AutoShip Dispatch — Issue #2

## Issue
fix: remove stale PluginServer stub from codebase

## Repository
Maleick/Code-Archaeology

## Branch
autoship/issue-2

## Task
Remove stale PluginServer/server() stub from codebase. Identify all references, remove stub code if truly unused, verify no tests or hooks depend on it.

## Acceptance Criteria
- [ ] PluginServer stub removed
- [ ] All tests pass
- [ ] No references remain in codebase

## Context
Code-Archaeology is the youngest repo with cleanest import graph. This is a P3 cleanup task.
