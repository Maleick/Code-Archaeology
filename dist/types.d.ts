/**
 * Core type definitions for Code Archaeology — OpenCode plugin for systematic
 * codebase excavation, cataloging, and restoration.
 *
 * @module code-archaeology-types
 */
/** Valid operational modes. */
export type ArchaeologyMode = "survey" | "excavate" | "restore";
/** Supported programming languages. */
export type TargetLanguage = "typescript" | "javascript" | "python" | "go" | "rust";
/** Expedition phases in fixed order. */
export type ExpeditionPhase = "survey" | "dead_code" | "legacy" | "dependencies" | "types_consolidate" | "types_harden" | "dry" | "errors" | "polish" | "final_verify";
/** Confidence levels for findings. */
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";
/** Status values for expedition progress. */
export type ExpeditionStatus = "pending" | "running" | "complete" | "failed" | "skipped";
/** Tool types used for analysis. */
export type AnalysisTool = "knip" | "unimported" | "depcheck" | "vulture" | "deadcode" | "staticcheck" | "cargo-udeps" | "rustc" | "madge" | "pydeps" | "godepgraph" | "cargo-deps" | "jscpd" | "tsc" | "mypy" | "go vet" | "pylint" | "golangci-lint" | "clippy" | "ast_grep" | "manual";
/** Event types emitted by the plugin. */
export type EventType = "phase_complete" | "phase_failed" | "finding_detected" | "report_generated";
/** Runtime parameters for an archaeology session. */
export interface ArchaeologyConfig {
    /** Absolute or relative path to repository root. */
    repo_path: string;
    /** Primary language for tooling and AST selection. */
    language: TargetLanguage;
    /** Operational mode. */
    mode: ArchaeologyMode;
    /** Whether to auto-restore medium-confidence findings. */
    strict_mode: boolean;
    /** Command to verify correctness (must exit 0 on success). */
    test_command: string;
    /** Command for static type verification. */
    typecheck_command: string;
    /** Git branch to create and work on. */
    branch_name: string;
}
/** Default configuration values. */
export declare const DEFAULT_CONFIG: ArchaeologyConfig;
/** A single detected artifact (dead code, legacy pattern, etc.). */
export interface Finding {
    /** Unique identifier for this finding. */
    id: string;
    /** Expedition phase that detected this. */
    phase: ExpeditionPhase;
    /** File path relative to repo root. */
    file: string;
    /** Line number (1-indexed). */
    line: number;
    /** Column number (1-indexed). */
    column?: number;
    /** Type of artifact found. */
    type: string;
    /** Human-readable description. */
    description: string;
    /** Confidence in this finding. */
    confidence: ConfidenceLevel;
    /** Whether this would be auto-removed in restore mode. */
    auto_removable: boolean;
    /** Recommended action. */
    recommendation: string;
    /** Tool that detected this (or "manual"). */
    detected_by: AnalysisTool;
}
/** A cluster of related findings (e.g., duplicate types). */
export interface FindingCluster {
    /** Cluster identifier. */
    id: string;
    /** Phase that produced this cluster. */
    phase: ExpeditionPhase;
    /** Human-readable name. */
    name: string;
    /** Findings in this cluster. */
    findings: Finding[];
    /** Consolidation/remediation plan. */
    plan: string;
    /** Whether this cluster is safe to auto-fix. */
    auto_fixable: boolean;
}
/** State of an individual expedition phase. */
export interface Expedition {
    /** Phase identifier. */
    phase: ExpeditionPhase;
    /** Human-readable name. */
    name: string;
    /** Current status. */
    status: ExpeditionStatus;
    /** Number of findings detected. */
    findings_count: number;
    /** Path to the generated report. */
    report_path?: string;
    /** ISO-8601 timestamp when phase started. */
    started_at?: string;
    /** ISO-8601 timestamp when phase completed. */
    completed_at?: string;
    /** Error message if phase failed. */
    error?: string;
}
/** Top-level structure of `.archaeology/session.json`. */
export interface Session {
    /** Schema version. */
    version: number;
    /** Plugin version. */
    plugin_version: string;
    /** Session identifier. */
    session_id: string;
    /** Configuration used for this session. */
    config: ArchaeologyConfig;
    /** ISO-8601 timestamp when session started. */
    started_at: string;
    /** ISO-8601 timestamp of last update. */
    updated_at: string;
    /** All expeditions and their status. */
    expeditions: Expedition[];
    /** Total findings across all expeditions. */
    total_findings: number;
    /** Number of auto-fixable findings. */
    auto_fixable_count: number;
    /** Baseline git commit SHA. */
    baseline_commit?: string;
    /** Whether the session completed successfully. */
    completed: boolean;
}
/** File inventory entry from the site survey. */
export interface FileEntry {
    /** Relative path. */
    path: string;
    /** File size in bytes. */
    size: number;
    /** Line count. */
    lines: number;
    /** Language detected. */
    language?: string;
    /** Whether this is a test file. */
    is_test: boolean;
}
/** Dependency entry from the site survey. */
export interface DependencyEntry {
    /** Package name. */
    name: string;
    /** Installed version. */
    version: string;
    /** Whether it's a dev dependency. */
    is_dev: boolean;
    /** Whether the package is deprecated. */
    is_deprecated?: boolean;
}
/** Baseline metrics captured at survey time. */
export interface BaselineMetrics {
    /** Total files. */
    total_files: number;
    /** Total lines of code. */
    total_lines: number;
    /** Test file count. */
    test_files: number;
    /** External dependency count. */
    dependencies: number;
    /** Type error count. */
    type_errors: number;
    /** Lint error count. */
    lint_errors: number;
    /** Test pass/fail status. */
    tests_passing: boolean;
}
/** Top-level structure of `.archaeology/site_survey.json`. */
export interface SiteSurvey {
    /** Schema version. */
    version: number;
    /** Baseline git commit. */
    baseline_commit: string;
    /** File inventory. */
    files: FileEntry[];
    /** Dependency inventory. */
    dependencies: DependencyEntry[];
    /** Baseline metrics. */
    metrics: BaselineMetrics;
}
/** A single edge in the dependency graph. */
export interface DependencyEdge {
    /** Source module. */
    from: string;
    /** Target module. */
    to: string;
    /** Import statement or reference. */
    import_statement?: string;
}
/** A circular dependency cycle. */
export interface DependencyCycle {
    /** Cycle identifier. */
    id: string;
    /** Files involved in the cycle. */
    files: string[];
    /** Edges forming the cycle. */
    edges: DependencyEdge[];
    /** Whether this is a direct cycle (A→B→A). */
    is_direct: boolean;
    /** Recommended fix strategy. */
    fix_strategy: string;
}
/** Summary statistics for a single expedition report. */
export interface ExpeditionReportSummary {
    /** Phase identifier. */
    phase: ExpeditionPhase;
    /** Number of findings. */
    findings: number;
    /** Number of HIGH confidence findings. */
    high_confidence: number;
    /** Number of MEDIUM confidence findings. */
    medium_confidence: number;
    /** Number of LOW confidence findings. */
    low_confidence: number;
    /** Estimated lines of code affected. */
    estimated_loc_impact: number;
}
/** Top-level structure of `FINAL_CATALOG.md` data. */
export interface FinalCatalog {
    /** Schema version. */
    version: number;
    /** Session summary. */
    session: Session;
    /** Per-expedition summaries. */
    expeditions: ExpeditionReportSummary[];
    /** Total lines added. */
    lines_added: number;
    /** Total lines removed. */
    lines_removed: number;
    /** Number of cycles broken. */
    cycles_broken: number;
    /** Number of types consolidated. */
    types_consolidated: number;
    /** Recommendations for future maintenance. */
    recommendations: string[];
}
/** CLI argument shape for `opencode-code-archaeology`. */
export interface CliArgs {
    /** Target repository path. */
    repo?: string;
    /** Target language. */
    language?: TargetLanguage;
    /** Operational mode. */
    mode?: ArchaeologyMode;
    /** Strict mode flag. */
    strict?: boolean;
    /** Specific phase to run (optional). */
    phase?: ExpeditionPhase;
    /** Test command override. */
    testCommand?: string;
    /** Typecheck command override. */
    typecheckCommand?: string;
    /** Branch name override. */
    branch?: string;
}
//# sourceMappingURL=types.d.ts.map