import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import test from "node:test";
import { withPreloadModule } from "./helpers/preload.mjs";

const execFileAsync = promisify(execFile);
const root = dirname(dirname(fileURLToPath(import.meta.url)));

const commandDirectory = join(root, "commands");
const commandTemplatePattern = /^code-archaeology(?:-[a-z0-9-]+)*$/;
const expectedCommandTemplates = [
  "code-archaeology",
  "code-archaeology-excavate",
  "code-archaeology-restore",
  "code-archaeology-survey",
];

function toCRLF(value) {
  return value.replace(/\r?\n/g, "\r\n");
}

async function withCrLfCommandTemplates(names, callback) {
  const commandPaths = names.map((name) => join(commandDirectory, `${name}.md`));
  const originals = await Promise.all(commandPaths.map((path) => readFile(path, "utf8")));

  try {
    await Promise.all(commandPaths.map((path, index) => writeFile(path, toCRLF(originals[index]))));
    return await callback(names);
  } finally {
    await Promise.all(commandPaths.map((path, index) => writeFile(path, originals[index])));
  }
}

async function listCommandTemplates() {
  const entries = await readdir(commandDirectory);
  return entries
    .filter((entry) => entry.endsWith(".md"))
    .map((entry) => entry.replace(/\.md$/, ""))
    .sort();
}

function assertCommandDiscovery(commandFiles) {
  const sorted = [...commandFiles].sort();
  const unexpectedCommandFiles = commandFiles.filter((name) => !commandTemplatePattern.test(name));

  assert.equal(commandFiles.length > 0, true, "command template discovery should find at least one command");
  assert.deepEqual(
    commandFiles.filter((name) => name.startsWith(".")),
    [],
    "command directory should not include hidden markdown files",
  );
  assert.deepEqual(commandFiles, sorted, "command template discovery should return sorted names");
  assert.deepEqual(
    expectedCommandTemplates.filter((name) => !commandFiles.includes(name)),
    [],
    "required command templates should be discoverable",
  );
  assert.equal(
    unexpectedCommandFiles.length,
    0,
    `unexpected command templates discovered: ${unexpectedCommandFiles.join(", ")}`,
  );
  assert.equal(commandFiles.length, expectedCommandTemplates.length, "command set should have expected parity");
}

test("assertCommandDiscovery should report unexpected command files explicitly", () => {
  let error;

  try {
    assertCommandDiscovery([
      "code-archaeology",
      "code-archaeology-excavate",
      "code-archaeology-restore",
      "code-archaeology-survey",
      "foo",
    ]);
  } catch (thrown) {
    error = thrown;
  }

  assert.ok(error instanceof Error);
  assert.equal(error.message, "unexpected command templates discovered: foo\n\n1 !== 0\n");
});

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

test("plugin config does not mutate the original skills.paths array", async () => {
  const pluginModule = await import("../dist/index.js");
  const hooks = await pluginModule.default();
  const originalPaths = ["/some/pre-existing/path"];
  const config = { skills: { paths: originalPaths } };

  await hooks.config(config);

  assert.equal(originalPaths.length, 1, "original array must not be mutated");
  assert.equal(config.skills.paths.length, 2);
  assert.equal(config.skills.paths[0], "/some/pre-existing/path");
  assert.equal(config.skills.paths[1], join(root, "skills"));
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

test("plugin config parses CRLF command templates", async () => {
  await withCrLfCommandTemplates(["code-archaeology"], async () => {
    const pluginModule = await import("../dist/index.js");
    const hooks = await pluginModule.default();
    const config = {};

    await hooks.config(config);

    assert.equal(
      config.command["code-archaeology"].description,
      "Start a Code Archaeology expedition to excavate, catalog, and restore a codebase by removing technical debt systematically",
    );
    assert.match(config.command["code-archaeology"].template, /^# /m);
  });
});

test("runtime version falls back to package.json when VERSION is empty", async () => {
  await withPreloadModule(
    "code-archaeology-runtime-preload-",
    `import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";

const originalReadFileSync = fs.readFileSync;
const versionPath = process.env.CODE_ARCH_VERSION_PATH;
const packageJsonPath = process.env.CODE_ARCH_PACKAGE_JSON_PATH;
const packageJsonContent = process.env.CODE_ARCH_PACKAGE_JSON_CONTENT;

fs.readFileSync = function readFileSync(path, ...args) {
  if (path === versionPath) {
    return "";
  }
  if (path === packageJsonPath && packageJsonContent) {
    return packageJsonContent;
  }
  return originalReadFileSync.call(this, path, ...args);
};

syncBuiltinESMExports();
`,
    async (preloadPath) => {
      const { stdout } = await execFileAsync(
        process.execPath,
        [
          "--import",
          preloadPath,
          "--input-type=module",
          "--eval",
          `import { version } from ${JSON.stringify(pathToFileURL(join(root, "dist", "runtime.js")).href)}; console.log(version);`,
        ],
        {
          cwd: root,
          env: {
            ...process.env,
            CODE_ARCH_VERSION_PATH: join(root, "VERSION"),
            CODE_ARCH_PACKAGE_JSON_PATH: join(root, "package.json"),
            CODE_ARCH_PACKAGE_JSON_CONTENT: `${JSON.stringify({ version: "8.8.8" })}\n`,
          },
        },
      );

      assert.equal(stdout.trim(), "8.8.8");
    },
  );
});

test("runtime version falls back to package.json when VERSION is missing", async () => {
  await withPreloadModule(
    "code-archaeology-runtime-preload-",
    `import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";

const originalReadFileSync = fs.readFileSync;
const versionPath = process.env.CODE_ARCH_VERSION_PATH;
const packageJsonPath = process.env.CODE_ARCH_PACKAGE_JSON_PATH;
const packageJsonContent = process.env.CODE_ARCH_PACKAGE_JSON_CONTENT;

fs.readFileSync = function readFileSync(path, ...args) {
  if (path === versionPath) {
    const error = new Error("missing VERSION");
    error.code = "ENOENT";
    throw error;
  }
  if (path === packageJsonPath && packageJsonContent) {
    return packageJsonContent;
  }
  return originalReadFileSync.call(this, path, ...args);
};

syncBuiltinESMExports();
`,
    async (preloadPath) => {
      const { stdout } = await execFileAsync(
        process.execPath,
        [
          "--import",
          preloadPath,
          "--input-type=module",
          "--eval",
          `import { version } from ${JSON.stringify(pathToFileURL(join(root, "dist", "runtime.js")).href)}; console.log(version);`,
        ],
        {
          cwd: root,
          env: {
            ...process.env,
            CODE_ARCH_VERSION_PATH: join(root, "VERSION"),
            CODE_ARCH_PACKAGE_JSON_PATH: join(root, "package.json"),
            CODE_ARCH_PACKAGE_JSON_CONTENT: `${JSON.stringify({ version: "9.9.9" })}\n`,
          },
        },
      );

      assert.equal(stdout.trim(), "9.9.9");
    },
  );
});

test("runtime version falls back to 0.0.0 when VERSION and package.json are missing", async () => {
  await withPreloadModule(
    "code-archaeology-runtime-preload-",
    `import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";

const originalReadFileSync = fs.readFileSync;
const missingPaths = new Set(
  (process.env.CODE_ARCH_MISSING_PATHS || "")
    .split(process.platform === "win32" ? ";" : ":")
    .filter(Boolean),
);

fs.readFileSync = function readFileSync(path, ...args) {
  if (missingPaths.has(path)) {
    const error = new Error(\`missing \${path}\`);
    error.code = "ENOENT";
    throw error;
  }
  return originalReadFileSync.call(this, path, ...args);
};

syncBuiltinESMExports();
`,
    async (preloadPath) => {
      const { stdout } = await execFileAsync(
        process.execPath,
        [
          "--import",
          preloadPath,
          "--input-type=module",
          "--eval",
          `import { version } from ${JSON.stringify(pathToFileURL(join(root, "dist", "runtime.js")).href)}; console.log(version);`,
        ],
        {
          cwd: root,
          env: {
            ...process.env,
            CODE_ARCH_MISSING_PATHS: `${join(root, "VERSION")}:${join(root, "package.json")}`,
          },
        },
      );

      assert.equal(stdout.trim(), "0.0.0");
    },
  );
});

test("runtime version falls back to 0.0.0 when package.json version is empty", async () => {
  await withPreloadModule(
    "code-archaeology-runtime-preload-",
    `import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";

const originalReadFileSync = fs.readFileSync;
const versionPath = process.env.CODE_ARCH_VERSION_PATH;
const packageJsonPath = process.env.CODE_ARCH_PACKAGE_JSON_PATH;
const packageJsonContent = process.env.CODE_ARCH_PACKAGE_JSON_CONTENT;

fs.readFileSync = function readFileSync(path, ...args) {
  if (path === versionPath) {
    const error = new Error("missing VERSION");
    error.code = "ENOENT";
    throw error;
  }
  if (path === packageJsonPath) {
    return packageJsonContent;
  }
  return originalReadFileSync.call(this, path, ...args);
};

syncBuiltinESMExports();
`,
    async (preloadPath) => {
      const { stdout } = await execFileAsync(
        process.execPath,
        [
          "--import",
          preloadPath,
          "--input-type=module",
          "--eval",
          `import { version } from ${JSON.stringify(pathToFileURL(join(root, "dist", "runtime.js")).href)}; console.log(version);`,
        ],
        {
          cwd: root,
          env: {
            ...process.env,
            CODE_ARCH_VERSION_PATH: join(root, "VERSION"),
            CODE_ARCH_PACKAGE_JSON_PATH: join(root, "package.json"),
            CODE_ARCH_PACKAGE_JSON_CONTENT: `${JSON.stringify({ version: "" })}\n`,
          },
        },
      );

      assert.equal(stdout.trim(), "0.0.0");
    },
  );
});

test("plugin config keeps templates without frontmatter descriptions", async () => {
  const template = "# Plain command\n\nNo frontmatter here.\n";
  await withPreloadModule(
    "code-archaeology-runtime-preload-",
    `import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";

const originalReadFileSync = fs.readFileSync;
const commandRoot = process.env.CODE_ARCH_COMMAND_ROOT;
const commandTemplate = process.env.CODE_ARCH_COMMAND_TEMPLATE;

fs.readFileSync = function readFileSync(path, ...args) {
  if (typeof path === "string" && path.startsWith(commandRoot) && path.endsWith(".md")) {
    return commandTemplate;
  }
  return originalReadFileSync.call(this, path, ...args);
};

syncBuiltinESMExports();
`,
    async (preloadPath) => {
      const { stdout } = await execFileAsync(
        process.execPath,
        [
          "--import",
          preloadPath,
          "--input-type=module",
          "--eval",
          `import { codeArchaeologyPlugin } from ${JSON.stringify(pathToFileURL(join(root, "dist", "runtime.js")).href)};
const hooks = await codeArchaeologyPlugin();
const config = {};
await hooks.config(config);
console.log(JSON.stringify(config.command["code-archaeology"]));`,
        ],
        {
          cwd: root,
          env: {
            ...process.env,
            CODE_ARCH_COMMAND_ROOT: commandDirectory,
            CODE_ARCH_COMMAND_TEMPLATE: template,
          },
        },
      );

      assert.deepEqual(JSON.parse(stdout), { template });
    },
  );
});

test("plugin config parses all command templates from CRLF source", async () => {
  const commandFiles = await listCommandTemplates();
  assertCommandDiscovery(commandFiles);

  await withCrLfCommandTemplates(commandFiles, async () => {
    const pluginModule = await import("../dist/index.js");
    const hooks = await pluginModule.default();
    const config = {};

    await hooks.config(config);

    for (const name of commandFiles) {
      const command = config.command[name];
      assert.equal(typeof command.description, "string");
      assert.match(command.template, /^# /m, `${name} template should include markdown header`);
      assert.equal(
        command.template.startsWith("---"),
        false,
        `${name} template should parse command frontmatter out`,
      );
    }
  });
});

test("plugin docs include yolo parameter in command template parsing", async () => {
  const pluginModule = await import("../dist/index.js");
  const hooks = await pluginModule.default();
  const config = {};

  await hooks.config(config);

  const commandTemplate = config.command["code-archaeology"].template;

  assert.equal(typeof commandTemplate, "string");
  assert.match(
    commandTemplate,
    /\|\s*`yolo`\s*\|\s*`false`\s*\|[\s\S]*force\s+`restore`/i,
    "code-archaeology template should document yolo parameter",
  );
  assert.match(commandTemplate, /\/code-archaeology --yolo/);
  assert.match(commandTemplate, /strict_mode:\s*true/i);
});

test("documentation pages include yolo command visibility", async () => {
  const docsWithYolo = [
    "wiki/Home.md",
    "wiki/Installation.md",
    "wiki/Expedition-Workflow.md",
    "skills/hermes/INTEGRATION.md",
  ];

  const contents = await Promise.all(
    docsWithYolo.map((path) => readFile(join(root, path), "utf8")),
  );

  for (const content of contents) {
    assert.match(content, /\/code-archaeology --yolo/);
  }
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
