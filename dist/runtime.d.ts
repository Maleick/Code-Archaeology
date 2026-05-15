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