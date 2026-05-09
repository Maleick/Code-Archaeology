# Code-Archaeology Expedition — TextQuest — 2026-05-09 10:47 UTC

## Executive Summary
- **Total Rust LOC**: ~404,527 lines across 1,150 `.rs` files (excluding `.autoship` workspaces and `target/`)
- **Dead code**: 79 `#[allow(dead_code)]` annotations in source; 1000+ clippy dead-code warnings in `textquest-dll`
- **TODOs/FIXMEs**: 21 in `src/` and `textquest*/src/` (low); most are in generated `target/` build artifacts
- **Platform split**: Heavy `#[cfg(windows)]` gating (8,525 occurrences) — core EQ memory/DLL logic is Windows-only
- **Complexity**: Top 5 largest files are all >4,000 LOC; `textquest/src/tui/app.rs` is 11,537 LOC
- **Module coupling**: Not analyzed (cargo-modules not installed)
- **Duplicate code**: Not analyzed (jscpd not installed)

## 1. Line-of-Code Analysis

### Largest Files (by LOC)
| Rank | File | LOC | Concern |
|------|------|-----|---------|
| 1 | `textquest/src/tui/app.rs` | 11,537 | **Massive** — likely violates single-responsibility |
| 2 | `textquest/src/tui/ui/map.rs` | 5,974 | Map rendering + state mixed |
| 3 | `textquest-dll/src/hooks/game_loop.rs` | 5,337 | Hook logic + game loop mixed |
| 4 | `textquest/src/orchestrator/mod.rs` | 4,662 | Orchestrator convergence point |
| 5 | `textquest/src/tui/state.rs` | 4,557 | TUI state management |
| 6 | `textquest-common/src/ipc.rs` | 4,394 | IPC serialization |
| 7 | `textquest-dll/src/combat/state.rs` | 4,197 | Combat state machine |
| 8 | `textquest/src/cli.rs` | 3,482 | CLI argument parsing |
| 9 | `textquest-common/src/nav.rs` | 3,452 | Navigation logic |
| 10 | `textquest/src/tui/ui/roster.rs` | 3,014 | Roster UI |

**Observation**: The top 3 files are all >5,000 LOC. `textquest/src/tui/app.rs` at 11,537 LOC is a clear refactoring target. TUI code dominates the largest files.

## 2. Dead Code Analysis

### `#[allow(dead_code)]` in Source (79 instances)
- `textquest-dll/src/`: ~40 instances — many are legitimate (Windows-only APIs, future combat hooks)
- `textquest/src/`: ~20 instances — some mask unused public APIs (Discord bridge, webhook, metrics admin)
- `textquest-common/src/`: ~15 instances — mostly offset/validation structs
- `textquest-soul/src/`: ~4 instances

### Genuinely Unused (clippy `dead_code` warnings)
- `textquest-dll/src/combat/buffs.rs`: `AbilityReuseMetadata`, `SharedCooldownKey`, `BanditDecisionPoint`, `BandolierItem`, `BandolierSet`, `BandolierRuleConfig`, `BandolierContext` — entire subsystems appear unwired
- `textquest-dll/src/stealth/trampoline.rs`: `harden_private_rwx_allocations`, `protect_registered` — stealth hardening stubs
- `textquest-dll/src/combat/ch_chain.rs`: Entire chain-heal module appears unused
- `textquest/src/hotkeys/registry.rs`: Registry is a stub
- `textquest/src/ipc/commands.rs`: Hotkey-to-IPC bridge is TODO

## 3. Complexity Hotspots

### Cognitive Complexity (clippy `-W clippy::cognitive_complexity`)
Clippy does not report cognitive complexity directly in this Rust version, but we can infer from file size and TODO density:

| File | LOC | Complexity Signal |
|------|-----|-------------------|
| `textquest/src/tui/app.rs` | 11,537 | Event loop + UI + state + IPC + map + roster all in one file |
| `textquest-dll/src/hooks/game_loop.rs` | 5,337 | Game loop hook + packet parsing + state updates |
| `textquest/src/orchestrator/mod.rs` | 4,662 | Camp loop + routing + group control + relay |
| `textquest-dll/src/combat/state.rs` | 4,197 | Combat state machine with many transitions |

### `too_many_arguments` Warning
- `textquest/src/camp/buffs.rs:349`: `check_buffs_with_context` takes 8 arguments (limit is 7). This is a classic complexity smell.

## 4. Platform Split Impact

### `#[cfg(windows)]` Gating
- **8,525 occurrences** across the repo (including `.autoship` workspaces)
- Core EQ memory reading, DLL injection, IPC, audio alerts, and scanner modules are all Windows-only
- **Testability impact**: macOS/Linux CI can only test non-Windows modules. The `cargo test --all --all-features` failure on macOS may be because Windows-only tests are compiled but fail at runtime (or feature-gated tests are missing).
- **Integration tests**: `tests/integration_test_loop.rs` and `tests/metrics_integration.rs` are explicitly `#[cfg(windows)]` — they will never run in CI.

### Recommendation
- Extract Windows-only logic into `textquest-win/` or `textquest-platform/` crates
- Add `#[cfg(not(windows))]` mock implementations for CI testability
- Gate `integration_test_loop.rs` behind a feature flag instead of `cfg(windows)` so it can be compiled (but skipped) on CI

## 5. Module Coupling (Manual Analysis)

Since `cargo-modules` is not installed, we use `use` statement density as a proxy:

### High-Coupling Modules (many `use` statements across crates)
- `textquest-common/src/ipc.rs`: Imported by almost every crate — central coupling hub
- `textquest-common/src/combat.rs`: 2,899 LOC — shared combat types imported everywhere
- `textquest-common/src/nav.rs`: 3,452 LOC — navigation types imported by TUI, orchestrator, DLL

### Circular Coupling Risk
- `textquest/src/orchestrator/mod.rs` imports from `textquest/src/camp/`, `textquest/src/nav/`, `textquest/src/combat/`
- `textquest/src/camp/state.rs` imports from `textquest/src/orchestrator/` (via `CampState` updates)
- This is a known pattern in the codebase but should be monitored

## 6. TODO/FIXME Density

### Source Code TODOs (21 in `src/` and `textquest*/src/`)
| File | Count | Nature |
|------|-------|--------|
| `textquest-common/src/offsets.rs` | 4 | Reverse engineering stubs |
| `textquest-dll/src/group/faction_guard.rs` | 1 | Config loading (#3488) |
| `textquest-dll/src/hotkeys/mod.rs` | 2 | EQ input hook (#1020) |
| `textquest-dll/src/hooks/fingerprint.rs` | 2 | Windows-specific tests |
| `textquest-dll/src/hooks/memcheck.rs` | 1 | Exception parsing (#2175) |
| `textquest-dll/src/commands/memorize_cmd.rs` | 1 | Live state wiring (#3138) |
| `textquest/src/tui/app.rs` | 1 | Web UI integration stub |
| `textquest/src/eq/spawn.rs` | 1 | Terminal text sanitization test |
| `textquest/src/hotkeys/registry.rs` | 1 | Config parsing stub |
| `textquest/src/testing/output.rs` | 1 | Session format comment |
| `textquest/src/ipc/commands.rs` | 4 | Hotkey-to-IPC bridge stubs |

**Observation**: TODO density is low (21 across 404K LOC = 0.005%). Most are legitimate stubs for Windows-only or live-EQ features.

## 7. Refactoring Opportunities

### Immediate Wins
| Opportunity | Effort | Impact | Suggested Issue Label |
|-------------|--------|--------|----------------------|
| Split `textquest/src/tui/app.rs` into `app/event_loop.rs`, `app/ui.rs`, `app/state.rs` | Medium | High — 11K LOC file is unmaintainable | `agent:ready`, `code-archaeology`, `refactor` |
| Split `textquest-dll/src/hooks/game_loop.rs` into `hooks/packet.rs`, `hooks/state.rs` | Medium | High — 5K LOC hook file | `agent:ready`, `code-archaeology`, `refactor` |
| Extract `check_buffs_with_context` into a builder/struct | Small | Medium — reduce 8 args to 1 config struct | `agent:ready`, `code-archaeology`, `refactor` |
| Remove dead `Bandolier*` structs or wire them up | Small | Low — dead code cleanup | `agent:ready`, `code-archaeology`, `debt` |
| Add `#[cfg(not(windows))]` mocks for CI testability | Medium | High — enables macOS/Linux CI coverage | `agent:ready`, `code-archaeology`, `ci` |
| Extract Windows-only modules into `textquest-win` crate | Large | High — clean platform split | `agent:ready`, `code-archaeology`, `refactor` |

## 8. New Issues to Create

1. **Refactor: Split tui/app.rs (11,537 LOC) into focused modules** (`agent:ready`, `code-archaeology`, `refactor`)
2. **Refactor: Split hooks/game_loop.rs (5,337 LOC) into packet + state modules** (`agent:ready`, `code-archaeology`, `refactor`)
3. **Refactor: Reduce check_buffs_with_context arity with builder pattern** (`agent:ready`, `code-archaeology`, `refactor`)
4. **Debt: Clean up dead Bandolier* structs in textquest-dll** (`agent:ready`, `code-archaeology`, `debt`)
5. **CI: Add #[cfg(not(windows))] mocks for Windows-only modules** (`agent:ready`, `code-archaeology`, `ci`)
6. **Refactor: Extract Windows-only logic into textquest-win crate** (`agent:ready`, `code-archaeology`, `refactor`)
