export declare const packageRoot: string;
export declare const id = "code-archaeology";
export declare const repoRoot: string;
export declare const version: string;
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