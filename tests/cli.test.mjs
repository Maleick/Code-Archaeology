import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

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
  assert.match(stdout, /doctor/);
  assert.match(stdout, /version/);
});

test("doctor reports core package files present", async () => {
  const { stdout } = await runCli(["doctor"]);

  assert.match(stdout, /Code Archaeology package files present/);
  assert.match(stdout, /commands\/code-archaeology\.md/);
  assert.match(stdout, /skills\/code-archaeology\/SKILL\.md/);
  assert.match(stdout, /hooks\/opencode\/init\.sh/);
  assert.match(stdout, /hooks\/opencode\/verify-phase\.sh/);
  assert.match(stdout, /hooks\/hermes\/setup\.sh/);
  assert.match(stdout, /hooks\/hermes\/runner\.sh/);
  assert.match(stdout, /skills\/hermes\/INTEGRATION\.md/);
  assert.match(stdout, /AGENTS\.md/);
  assert.match(stdout, /README\.md/);
  assert.match(stdout, /INSTALL\.md/);
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
