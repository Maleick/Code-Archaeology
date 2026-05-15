#!/usr/bin/env node

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { isWindows } from "./platform.js";

const PLUGIN = "opencode-code-archaeology@git+https://github.com/Maleick/Code-Archaeology.git";
const REQUIRED_FILES = [
  "commands/code-archaeology.md",
  "skills/code-archaeology/SKILL.md",
  "skills/codex/SKILL.md",
  "hooks/opencode/init.sh",
  "hooks/opencode/verify-phase.sh",
  "hooks/opencode/update-expedition.sh",
  "hooks/opencode/revert-phase.sh",
  "hooks/hermes/setup.sh",
  "hooks/hermes/runner.sh",
  "skills/hermes/INTEGRATION.md",
  "AGENTS.md",
  "README.md",
  "INSTALL.md",
];

const REQUIRED_FILES_PS1 = [
  "commands/code-archaeology.md",
  "skills/code-archaeology/SKILL.md",
  "skills/codex/SKILL.md",
  "hooks/opencode/init.ps1",
  "hooks/opencode/verify-phase.ps1",
  "hooks/opencode/update-expedition.ps1",
  "hooks/opencode/revert-phase.ps1",
  "hooks/hermes/setup.ps1",
  "hooks/hermes/runner.ps1",
  "skills/hermes/INTEGRATION.md",
  "AGENTS.md",
  "README.md",
  "INSTALL.md",
];

const cliFile = fileURLToPath(import.meta.url);
const root = dirname(dirname(cliFile));
const skillsPath = join(root, "skills");
const codexSkillSource = join(root, "skills", "codex", "SKILL.md");

function configPath(): string {
  const configDir = process.env.OPENCODE_CONFIG_DIR || join(process.env.HOME || ".", ".config", "opencode");
  return join(configDir, "opencode.json");
}

function codexSkillPath(): string {
  const codexHome = process.env.CODEX_HOME || join(process.env.HOME || ".", ".codex");
  return join(codexHome, "skills", "code-archaeology", "SKILL.md");
}

function backupPath(target: string): string {
  let candidate = `${target}.bak`;
  let index = 1;
  while (existsSync(candidate)) {
    candidate = `${target}.bak.${index}`;
    index += 1;
  }
  return candidate;
}

async function readPackageVersion(): Promise<string> {
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  return packageJson.version;
}

function printHelp(): void {
  console.log(`Code Archaeology CLI

Usage:
  opencode-code-archaeology help
  opencode-code-archaeology install
  opencode-code-archaeology install-codex
  opencode-code-archaeology doctor
  opencode-code-archaeology version

Commands:
  install   Add Code Archaeology to opencode.json plugin array
  install-codex
            Install the Code Archaeology skill into $CODEX_HOME/skills
  doctor    Verify core package files are present
  version   Print the package version
  help      Show this help`);
}

async function install(): Promise<void> {
  const target = configPath();
  let config: Record<string, unknown> = {};
  const exists = existsSync(target);

  if (exists) {
    config = JSON.parse(await readFile(target, "utf8"));
  }

  const plugins = Array.isArray(config.plugin) ? config.plugin : [];
  if (!plugins.includes(PLUGIN)) {
    config.plugin = [...plugins, PLUGIN];
  }

  const skills = typeof config.skills === "object" && config.skills !== null ? config.skills : {};
  const paths = Array.isArray((skills as { paths?: unknown }).paths)
    ? (skills as { paths: unknown[] }).paths
    : [];
  if (!paths.includes(skillsPath)) {
    config.skills = { ...skills, paths: [...paths, skillsPath] };
  }

  await mkdir(dirname(target), { recursive: true });
  let backup: string | undefined;
  if (exists) {
    backup = backupPath(target);
    await copyFile(target, backup);
  }
  await writeFile(target, `${JSON.stringify(config, null, 2)}\n`);

  console.log(`Updated ${target}`);
  if (backup) {
    console.log(`Backup written to ${backup}`);
  }
  console.log("Next steps:");
  console.log("1. Restart OpenCode.");
  console.log("2. Run /code-archaeology-survey in your target repository.");
  console.log("Cross-platform: uses .ps1 hooks on Windows, .sh hooks on Unix.");
}

async function installCodex(): Promise<void> {
  const target = codexSkillPath();
  await mkdir(dirname(target), { recursive: true });
  let backup: string | undefined;
  if (existsSync(target)) {
    backup = backupPath(target);
    await copyFile(target, backup);
  }
  await copyFile(codexSkillSource, target);

  console.log(`Installed Code Archaeology Codex skill to ${target}`);
  if (backup) {
    console.log(`Backup written to ${backup}`);
  }
  console.log("Next steps:");
  console.log("1. Restart Codex or start a new Codex session so skills are reloaded.");
  console.log("2. Ask Codex to use the code-archaeology skill in your target repository.");
}

function doctor(): void {
  const files = isWindows() ? REQUIRED_FILES_PS1 : REQUIRED_FILES;
  const missing = files.filter((file) => !existsSync(join(root, file)));
  if (missing.length > 0) {
    console.error("Missing Code Archaeology package files:");
    for (const file of missing) {
      console.error(`- ${file}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Code Archaeology package files present:");
  for (const file of files) {
    console.log(`- ${file}`);
  }
}

const command = process.argv[2] || "help";

try {
  if (command === "version") {
    console.log(await readPackageVersion());
  } else if (command === "doctor") {
    doctor();
  } else if (command === "install") {
    await install();
  } else if (command === "install-codex") {
    await installCodex();
  } else {
    printHelp();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
