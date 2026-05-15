import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { withPreloadModule } from "./helpers/preload.mjs";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const cliPath = join(root, "dist", "cli.js");
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));

async function runCli(args, options = {}) {
  return execFileAsync(process.execPath, [cliPath, ...args], {
    cwd: root,
    env: { ...process.env, ...options.env },
  });
}

test("version prints package version", async () => {
  const { stdout } = await runCli(["version"]);

  assert.equal(stdout.trim(), packageJson.version);
});

test("help lists install, doctor, and version", async () => {
  const { stdout } = await runCli(["help"]);

  assert.match(stdout, /install/);
  assert.match(stdout, /install-codex/);
  assert.match(stdout, /doctor/);
  assert.match(stdout, /version/);
});

test("no arguments defaults to help output", async () => {
  const { stdout } = await runCli([]);

  assert.match(stdout, /install/);
  assert.match(stdout, /doctor/);
  assert.match(stdout, /version/);
});

test("unknown command falls back to help output", async () => {
  const { stdout } = await runCli(["unknown-command"]);

  assert.match(stdout, /install/);
  assert.match(stdout, /doctor/);
  assert.match(stdout, /version/);
});

test("doctor reports core package files present", async () => {
  const { stdout } = await runCli(["doctor"]);

  assert.match(stdout, /Code Archaeology package files present/);
  assert.match(stdout, /commands\/code-archaeology\.md/);
  assert.match(stdout, /skills\/code-archaeology\/SKILL\.md/);
  assert.match(stdout, /skills\/codex\/SKILL\.md/);
  assert.match(stdout, /hooks\/opencode\/init\.sh/);
  assert.match(stdout, /hooks\/opencode\/verify-phase\.sh/);
  assert.match(stdout, /hooks\/opencode\/update-expedition\.sh/);
  assert.match(stdout, /hooks\/opencode\/revert-phase\.sh/);
  assert.match(stdout, /hooks\/hermes\/setup\.sh/);
  assert.match(stdout, /hooks\/hermes\/runner\.sh/);
  assert.match(stdout, /skills\/hermes\/INTEGRATION\.md/);
  assert.match(stdout, /AGENTS\.md/);
  assert.match(stdout, /README\.md/);
  assert.match(stdout, /INSTALL\.md/);
});

test("install-codex copies Codex skill into CODEX_HOME", async () => {
  const codexHome = await mkdtemp(join(tmpdir(), "code-archaeology-codex-"));
  try {
    const { stdout } = await runCli(["install-codex"], { env: { CODEX_HOME: codexHome } });
    const skillPath = join(codexHome, "skills", "code-archaeology", "SKILL.md");
    const skill = await readFile(skillPath, "utf8");

    assert.match(stdout, /Installed Code Archaeology Codex skill/);
    assert.match(skill, /name: code-archaeology/);
    assert.match(skill, /Code Archaeology For Codex/);
  } finally {
    await rm(codexHome, { recursive: true, force: true });
  }
});

test("install-codex creates non-overwriting backups for existing skill", async () => {
  const codexHome = await mkdtemp(join(tmpdir(), "code-archaeology-codex-"));
  try {
    const skillDir = join(codexHome, "skills", "code-archaeology");
    const skillPath = join(skillDir, "SKILL.md");
    await mkdir(skillDir, { recursive: true });
    await writeFile(skillPath, "existing skill\n");
    await writeFile(`${skillPath}.bak`, "existing backup\n");

    await runCli(["install-codex"], { env: { CODEX_HOME: codexHome } });

    const files = await readdir(skillDir);
    assert.equal(await readFile(`${skillPath}.bak`, "utf8"), "existing backup\n");
    assert.ok(files.some((file) => /^SKILL\.md\.bak\.\d+$/.test(file)));
  } finally {
    await rm(codexHome, { recursive: true, force: true });
  }
});

test("doctor exits non-zero and lists missing package files", async () => {
  await withPreloadModule(
    "code-archaeology-cli-preload-",
    `import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";

const originalExistsSync = fs.existsSync;
const root = process.env.CODE_ARCHAEOLOGY_ROOT;

fs.existsSync = function existsSync(path) {
  if (typeof path === "string" && path.startsWith(root)) {
    return false;
  }
  return originalExistsSync.call(this, path);
};

syncBuiltinESMExports();
`,
    async (preloadPath) => {
      await assert.rejects(
        execFileAsync(process.execPath, ["--import", preloadPath, cliPath, "doctor"], {
          cwd: root,
          env: { ...process.env, CODE_ARCHAEOLOGY_ROOT: root },
        }),
        (error) => {
          assert.equal(error.code, 1);
          assert.match(error.stderr, /Missing Code Archaeology package files:/);
          assert.match(error.stderr, /commands\/code-archaeology\.md/);
          return true;
        },
      );
    },
  );
});

test("install creates opencode config with plugin entry", async () => {
  const configDir = await mkdtemp(join(tmpdir(), "code-archaeology-install-"));
  try {
    await runCli(["install"], { env: { OPENCODE_CONFIG_DIR: configDir } });

    const config = JSON.parse(await readFile(join(configDir, "opencode.json"), "utf8"));
    assert.deepEqual(config.plugin, [
      "opencode-code-archaeology@git+https://github.com/Maleick/Code-Archaeology.git",
    ]);
  } finally {
    await rm(configDir, { recursive: true, force: true });
  }
});

test("install creates opencode config with skills path", async () => {
  const configDir = await mkdtemp(join(tmpdir(), "code-archaeology-install-"));
  try {
    await runCli(["install"], { env: { OPENCODE_CONFIG_DIR: configDir } });

    const config = JSON.parse(await readFile(join(configDir, "opencode.json"), "utf8"));
    assert.deepEqual(config.skills.paths, [join(root, "skills")]);
  } finally {
    await rm(configDir, { recursive: true, force: true });
  }
});

test("install preserves fields and existing plugin entries", async () => {
  const configDir = await mkdtemp(join(tmpdir(), "code-archaeology-install-"));
  try {
    await writeFile(
      join(configDir, "opencode.json"),
      `${JSON.stringify({ theme: "dark", plugin: ["existing-plugin"] }, null, 2)}\n`,
    );

    await runCli(["install"], { env: { OPENCODE_CONFIG_DIR: configDir } });

    const config = JSON.parse(await readFile(join(configDir, "opencode.json"), "utf8"));
    assert.equal(config.theme, "dark");
    assert.deepEqual(config.plugin, [
      "existing-plugin",
      "opencode-code-archaeology@git+https://github.com/Maleick/Code-Archaeology.git",
    ]);
  } finally {
    await rm(configDir, { recursive: true, force: true });
  }
});

test("install preserves existing skill paths", async () => {
  const configDir = await mkdtemp(join(tmpdir(), "code-archaeology-install-"));
  try {
    const existingPath = join(tmpdir(), "existing-skills");
    await writeFile(
      join(configDir, "opencode.json"),
      `${JSON.stringify({ skills: { paths: [existingPath] } }, null, 2)}\n`,
    );

    await runCli(["install"], { env: { OPENCODE_CONFIG_DIR: configDir } });

    const config = JSON.parse(await readFile(join(configDir, "opencode.json"), "utf8"));
    assert.deepEqual(config.skills.paths, [existingPath, join(root, "skills")]);
  } finally {
    await rm(configDir, { recursive: true, force: true });
  }
});

test("install does not duplicate plugin entry", async () => {
  const configDir = await mkdtemp(join(tmpdir(), "code-archaeology-install-"));
  try {
    await runCli(["install"], { env: { OPENCODE_CONFIG_DIR: configDir } });
    await runCli(["install"], { env: { OPENCODE_CONFIG_DIR: configDir } });

    const config = JSON.parse(await readFile(join(configDir, "opencode.json"), "utf8"));
    assert.equal(
      config.plugin.filter(
        (entry) => entry === "opencode-code-archaeology@git+https://github.com/Maleick/Code-Archaeology.git",
      ).length,
      1,
    );
  } finally {
    await rm(configDir, { recursive: true, force: true });
  }
});

test("install does not duplicate skills path", async () => {
  const configDir = await mkdtemp(join(tmpdir(), "code-archaeology-install-"));
  try {
    await runCli(["install"], { env: { OPENCODE_CONFIG_DIR: configDir } });
    await runCli(["install"], { env: { OPENCODE_CONFIG_DIR: configDir } });

    const config = JSON.parse(await readFile(join(configDir, "opencode.json"), "utf8"));
    assert.equal(
      config.skills.paths.filter((p) => p === join(root, "skills")).length,
      1,
    );
  } finally {
    await rm(configDir, { recursive: true, force: true });
  }
});

test("install skips write and backup when config is already up to date", async () => {
  const configDir = await mkdtemp(join(tmpdir(), "code-archaeology-install-"));
  try {
    await runCli(["install"], { env: { OPENCODE_CONFIG_DIR: configDir } });

    const filesAfterFirst = await readdir(configDir);
    const { stdout } = await runCli(["install"], { env: { OPENCODE_CONFIG_DIR: configDir } });
    const filesAfterSecond = await readdir(configDir);

    assert.match(stdout, /already up to date/);
    assert.equal(filesAfterFirst.length, filesAfterSecond.length, "no new backup files created on idempotent install");
  } finally {
    await rm(configDir, { recursive: true, force: true });
  }
});

test("install creates non-overwriting backups for existing config", async () => {
  const configDir = await mkdtemp(join(tmpdir(), "code-archaeology-install-"));
  try {
    const configPath = join(configDir, "opencode.json");
    await writeFile(configPath, `${JSON.stringify({ theme: "dark" }, null, 2)}\n`);
    await writeFile(`${configPath}.bak`, "existing backup\n");

    await runCli(["install"], { env: { OPENCODE_CONFIG_DIR: configDir } });

    const files = await readdir(configDir);
    assert.equal(await readFile(`${configPath}.bak`, "utf8"), "existing backup\n");
    assert.ok(files.some((file) => /^opencode\.json\.bak\.\d+$/.test(file)));
  } finally {
    await rm(configDir, { recursive: true, force: true });
  }
});

test("doctor uses .ps1 file list on Windows", async () => {
  await withPreloadModule(
    "code-archaeology-windows-",
    `Object.defineProperty(process, "platform", { value: "win32", configurable: true });`,
    async (preloadPath) => {
      const { stdout } = await execFileAsync(process.execPath, ["--import", preloadPath, cliPath, "doctor"], {
        cwd: root,
        env: { ...process.env },
      });
      assert.match(stdout, /Code Archaeology package files present/);
      assert.match(stdout, /hooks\/opencode\/init\.ps1/);
      assert.match(stdout, /hooks\/opencode\/verify-phase\.ps1/);
      assert.match(stdout, /hooks\/hermes\/setup\.ps1/);
      assert.doesNotMatch(stdout, /init\.sh/);
    },
  );
});

test("install uses HOME fallback for config path when OPENCODE_CONFIG_DIR is unset", async () => {
  const fakeHome = await mkdtemp(join(tmpdir(), "code-archaeology-home-"));
  try {
    const { env } = process;
    const stripped = { ...env, HOME: fakeHome };
    delete stripped.OPENCODE_CONFIG_DIR;
    await execFileAsync(process.execPath, [cliPath, "install"], { cwd: root, env: stripped });

    const config = JSON.parse(
      await readFile(join(fakeHome, ".config", "opencode", "opencode.json"), "utf8"),
    );
    assert.ok(Array.isArray(config.plugin));
  } finally {
    await rm(fakeHome, { recursive: true, force: true });
  }
});

test("install-codex uses HOME fallback for skill path when CODEX_HOME is unset", async () => {
  const fakeHome = await mkdtemp(join(tmpdir(), "code-archaeology-home-"));
  try {
    const { env } = process;
    const stripped = { ...env, HOME: fakeHome };
    delete stripped.CODEX_HOME;
    await execFileAsync(process.execPath, [cliPath, "install-codex"], { cwd: root, env: stripped });

    const skillPath = join(fakeHome, ".codex", "skills", "code-archaeology", "SKILL.md");
    const skill = await readFile(skillPath, "utf8");
    assert.match(skill, /name: code-archaeology/);
  } finally {
    await rm(fakeHome, { recursive: true, force: true });
  }
});

test("install exits non-zero when existing opencode config is invalid JSON", async () => {
  const configDir = await mkdtemp(join(tmpdir(), "code-archaeology-install-"));
  try {
    await writeFile(join(configDir, "opencode.json"), "{ invalid json\n");

    await assert.rejects(runCli(["install"], { env: { OPENCODE_CONFIG_DIR: configDir } }), (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /invalid json|Unexpected token|Expected property name/i);
      return true;
    });
  } finally {
    await rm(configDir, { recursive: true, force: true });
  }
});
