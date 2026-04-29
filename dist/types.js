/**
 * Core type definitions for Code Archaeology — OpenCode plugin for systematic
 * codebase excavation, cataloging, and restoration.
 *
 * @module code-archaeology-types
 */
/** Default configuration values. */
export const DEFAULT_CONFIG = {
    repo_path: ".",
    language: "typescript",
    mode: "survey",
    strict_mode: false,
    test_command: "npm test",
    typecheck_command: "npx tsc --noEmit",
    branch_name: "refactor/archaeology",
};
//# sourceMappingURL=types.js.map