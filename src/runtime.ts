import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isWindows, getHookExtension, getShellCommand } from "./platform.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const packageRoot = resolve(__dirname, "..");
export const id = "code-archaeology";
export const repoRoot = packageRoot;

const versionPath = resolve(packageRoot, "VERSION");
export const version = readFileSync(versionPath, "utf8").trim();

type OpenCodeConfig = {
  command?: Record<string, { template: string; description?: string }>;
  skills?: {
    paths?: string[];
  };
};

const commandFiles = [
  "code-archaeology",
  "code-archaeology-survey",
  "code-archaeology-excavate",
  "code-archaeology-restore",
] as const;

function parseCommand(name: string): { template: string; description?: string } {
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

function loadCommands(): Record<string, { template: string; description?: string }> {
  return Object.fromEntries(commandFiles.map((name) => [name, parseCommand(name)]));
}

export async function codeArchaeologyPlugin() {
  const skillsPath = resolve(packageRoot, "skills");

  return {
    config(config: OpenCodeConfig) {
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
