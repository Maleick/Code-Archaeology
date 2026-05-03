import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test("package root default export is an OpenCode plugin function", async () => {
  const pluginModule = await import("../dist/index.js");

  assert.equal(typeof pluginModule.default, "function");
});

test("package root exposes only the default runtime plugin export", async () => {
  const pluginModule = await import("../dist/index.js");

  assert.deepEqual(Object.keys(pluginModule), ["default"]);
});

test("plugin subpath exposes only the default runtime plugin export", async () => {
  const pluginModule = await import("../dist/plugin.js");

  assert.deepEqual(Object.keys(pluginModule), ["default"]);
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
});

test("legacy plugin shim remains default-only", async () => {
  const shim = await readFile(join(root, "plugins", "code-archaeology.ts"), "utf8");

  assert.equal(shim.trim(), 'export { default } from "../src/index.ts";');
});
