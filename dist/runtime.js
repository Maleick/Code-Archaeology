import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const packageRoot = resolve(__dirname, "..");
export const id = "code-archaeology";
export const repoRoot = packageRoot;
const versionPath = resolve(packageRoot, "VERSION");
export const version = readFileSync(versionPath, "utf8").trim();
export async function server() {
    return {
        event() {
            return undefined;
        },
    };
}
const commandFiles = [
    "code-archaeology",
    "code-archaeology-survey",
    "code-archaeology-excavate",
    "code-archaeology-restore",
];
function parseCommand(name) {
    const template = readFileSync(resolve(packageRoot, "commands", `${name}.md`), "utf8");
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
                config.skills.paths.push(skillsPath);
            }
        },
    };
}
//# sourceMappingURL=runtime.js.map