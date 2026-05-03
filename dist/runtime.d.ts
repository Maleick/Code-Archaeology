import type { PluginServer } from "./types.js";
export declare const packageRoot: string;
export declare const id = "code-archaeology";
export declare const repoRoot: string;
export declare const version: string;
export declare function server(): Promise<PluginServer>;
type OpenCodeConfig = {
    command?: Record<string, {
        template: string;
        description?: string;
    }>;
    skills?: {
        paths?: string[];
    };
};
export declare function codeArchaeologyPlugin(): Promise<{
    config(config: OpenCodeConfig): void;
}>;
export {};
//# sourceMappingURL=runtime.d.ts.map