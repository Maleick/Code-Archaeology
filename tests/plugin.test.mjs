import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = dirname(dirname(fileURLToPath(import.meta.url)));

test("package root default export is an OpenCode plugin function", async () => {
  const pluginModule = await import("../dist/index.js");

  assert.equal(typeof pluginModule.default, "function");
});

test("package root exposes default runtime plugin and public type values", async () => {
  const pluginModule = await import("../dist/index.js");

  assert.deepEqual(Object.keys(pluginModule).sort(), ["DEFAULT_CONFIG", "default"]);
  assert.equal(pluginModule.DEFAULT_CONFIG.mode, "survey");
});

test("plugin subpath exposes default runtime plugin and public type values", async () => {
  const pluginModule = await import("../dist/plugin.js");

  assert.deepEqual(Object.keys(pluginModule).sort(), ["DEFAULT_CONFIG", "default"]);
  assert.equal(typeof pluginModule.default, "function");
});

test("plugin config registers Code Archaeology skills path", async () => {
  const pluginModule = await import("../dist/index.js");
  const hooks = await pluginModule.default();
  const config = {};

  await hooks.config(config);

  assert.deepEqual(config.skills.paths, [join(root, "skills")]);
});

test("plugin config preserves existing commands and skill paths", async () => {
  const pluginModule = await import("../dist/index.js");
  const hooks = await pluginModule.default();
  const existingPath = join(root, "skills");
  const config = {
    command: {
      existing: { template: "keep me", description: "Existing command" },
    },
    skills: { paths: [existingPath] },
  };

  await hooks.config(config);

  assert.equal(config.command.existing.template, "keep me");
  assert.equal(config.command["code-archaeology"].description?.includes("Code Archaeology"), true);
  assert.deepEqual(config.skills.paths, [existingPath]);
});

test("plugin config registers Code Archaeology command templates", async () => {
  const pluginModule = await import("../dist/index.js");
  const hooks = await pluginModule.default();
  const config = {};

  await hooks.config(config);

  assert.deepEqual(Object.keys(config.command).sort(), [
    "code-archaeology",
    "code-archaeology-excavate",
    "code-archaeology-restore",
    "code-archaeology-survey",
  ]);
  assert.equal(
    config.command["code-archaeology-survey"].description,
    "Run Code Archaeology in survey mode — catalog artifacts only, zero file changes",
  );
  assert.match(config.command["code-archaeology"].template, /Systematic Codebase Excavation/);
  assert.match(config.command["code-archaeology"].template, /runs the full 10-phase survey chain/i);
  assert.match(config.command["code-archaeology"].template, /use `\/code-archaeology-restore`/i);
});

test("legacy plugin shim remains repo-local and default-only", async () => {
  const shim = await readFile(join(root, "plugins", "code-archaeology.ts"), "utf8");

  assert.equal(shim.trim(), 'export { default } from "../src/index.ts";');
});

test("package contents exclude repo-local plugin shim and include public types", async () => {
  const { stdout } = await execFileAsync("npm", ["pack", "--json", "--dry-run"], { cwd: root });
  const pack = JSON.parse(stdout.slice(stdout.indexOf("[")))[0];
  const files = pack.files.map((file) => file.path);

  assert.equal(files.includes("plugins/code-archaeology.ts"), false);
  assert.equal(files.includes("dist/types.d.ts"), true);
});
