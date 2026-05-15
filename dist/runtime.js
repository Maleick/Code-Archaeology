import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, "..");
const versionPath = resolve(packageRoot, "VERSION");
const packageJsonPath = resolve(packageRoot, "package.json");
function resolveVersion() {
    try {
        const v = readFileSync(versionPath, "utf8").trim();
        if (v.length > 0)
            return v;
    }
    catch {
        // fall through to package.json
    }
    try {
        const packageVersion = JSON.parse(readFileSync(packageJsonPath, "utf8")).version;
        if (typeof packageVersion === "string" && packageVersion.length > 0) {
            return packageVersion;
        }
    }
    catch {
        return "0.0.0";
    }
    return "0.0.0";
}
export const version = resolveVersion();
const commandFiles = [
    "code-archaeology",
    "code-archaeology-survey",
    "code-archaeology-excavate",
    "code-archaeology-restore",
];
function parseCommand(name) {
    const template = readFileSync(resolve(packageRoot, "commands", `${name}.md`), "utf8").replace(/\r\n/g, "\n");
    const match = template.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
        return { template };
    }
    const description = match[1]
        .split("\n")
        .find((line) => line.startsWith("description:"))
        ?.slice("description:".length)
        .trim();
    return { template: match[2].trimStart(), description };
}
function loadCommands() {
    return Object.fromEntries(commandFiles.map((name) => [name, parseCommand(name)]));
}
export async function codeArchaeologyPlugin() {
    const skillsPath = resolve(packageRoot, "skills");
    return {
        config(config) {
            config.command = {
                ...(config.command ?? {}),
                ...loadCommands(),
            };
            config.skills = config.skills ?? {};
            config.skills.paths = config.skills.paths ?? [];
            if (!config.skills.paths.includes(skillsPath)) {
                config.skills.paths = [...config.skills.paths, skillsPath];
            }
        },
    };
}
//# sourceMappingURL=runtime.js.map