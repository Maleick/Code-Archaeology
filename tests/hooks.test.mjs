import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = process.cwd();

async function makeHookRepo() {
  const repo = await mkdtemp(join(tmpdir(), "code-archaeology-hooks-"));
  await cp(join(root, "hooks"), join(repo, "hooks"), { recursive: true });
  await cp(join(root, "VERSION"), join(repo, "VERSION"));
  await execFileAsync("git", ["init"], { cwd: repo });
  await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  await execFileAsync("git", ["config", "user.name", "Test User"], { cwd: repo });
  await writeFile(join(repo, "package.json"), `${JSON.stringify({ scripts: { test: "true" } })}\n`);
  await execFileAsync("git", ["add", "."], { cwd: repo });
  await execFileAsync("git", ["commit", "-m", "initial"], { cwd: repo });
  return repo;
}

test("Hermes runner initializes a clean repository without prior setup", async () => {
  const repo = await makeHookRepo();
  try {
    const { stdout } = await execFileAsync("bash", [join(repo, "hooks", "hermes", "runner.sh")], {
      cwd: repo,
    });

    const session = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.match(stdout, /Initialized Hermes session/);
    assert.equal(session.runtime, "hermes");
    assert.deepEqual(session.completed_phases, ["site-survey"]);
    assert.equal(session.current_phase, "dead-code");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Hermes runner blocks malformed session state instead of advancing", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    await writeFile(
      join(repo, ".archaeology", "session.json"),
      `${JSON.stringify({ runtime: "hermes", status: "running", current_phase: "unknown-phase", mode: "survey" })}\n`,
    );

    await assert.rejects(
      execFileAsync("bash", [join(repo, "hooks", "hermes", "runner.sh")], { cwd: repo }),
      /Unknown Hermes phase/,
    );

    const session = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.equal(session.status, "blocked");
    assert.equal(session.flags.blocked_reason, "unknown phase: unknown-phase");
    assert.equal(session.current_phase, "unknown-phase");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Hermes runner blocks invalid session JSON without overwriting it", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    const sessionPath = join(repo, ".archaeology", "session.json");
    await writeFile(sessionPath, "{ invalid json\n");

    await assert.rejects(
      execFileAsync("bash", [join(repo, "hooks", "hermes", "runner.sh")], { cwd: repo }),
      /Invalid Hermes session file/,
    );

    assert.equal(await readFile(sessionPath, "utf8"), "{ invalid json\n");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
