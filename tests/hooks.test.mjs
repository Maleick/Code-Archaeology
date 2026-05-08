import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
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

test("Hermes runner initializes a valid shared session without current_phase", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    await writeFile(
      join(repo, ".archaeology", "session.json"),
      `${JSON.stringify({
        version: 1,
        config: { mode: "survey", branch_name: "refactor/archaeology" },
        expeditions: [],
        completed: false,
      })}\n`,
    );

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

test("Hermes runner does not follow predictable session temp symlinks when blocking", async () => {
  const repo = await makeHookRepo();
  const victimDir = await mkdtemp(join(tmpdir(), "code-archaeology-victim-"));
  const victim = join(victimDir, "victim.txt");
  try {
    await mkdir(join(repo, ".archaeology"));
    await writeFile(victim, "do not overwrite\n");
    await writeFile(
      join(repo, ".archaeology", "session.json"),
      `${JSON.stringify({ runtime: "hermes", status: "running", current_phase: "unknown-phase", mode: "survey" })}\n`,
    );
    await symlink(victim, join(repo, ".archaeology", "session.json.tmp"));

    await assert.rejects(
      execFileAsync("bash", [join(repo, "hooks", "hermes", "runner.sh")], { cwd: repo }),
      /Unknown Hermes phase/,
    );

    const sessionPath = join(repo, ".archaeology", "session.json");
    const sessionStat = await lstat(sessionPath);
    const session = JSON.parse(await readFile(sessionPath, "utf8"));
    assert.equal(await readFile(victim, "utf8"), "do not overwrite\n");
    assert.equal(sessionStat.isSymbolicLink(), false);
    assert.equal(sessionStat.isFile(), true);
    assert.equal(session.status, "blocked");
    assert.equal(session.flags.blocked_reason, "unknown phase: unknown-phase");
  } finally {
    await rm(repo, { recursive: true, force: true });
    await rm(victimDir, { recursive: true, force: true });
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

test("Hermes runner blocks restore mode without operator approval", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    const marker = join(repo, "hermes-rce-marker");
    await writeFile(
      join(repo, ".archaeology", "session.json"),
      `${JSON.stringify({
        runtime: "hermes",
        status: "running",
        current_phase: "site-survey",
        completed_phases: [],
        mode: "restore",
        test_command: `printf exploited > ${marker}`,
        typecheck_command: "true",
        branch_name: "refactor/archaeology",
      })}\n`,
    );

    await assert.rejects(
      execFileAsync("bash", [join(repo, "hooks", "hermes", "runner.sh")], { cwd: repo }),
      /Hermes restore mode is disabled/,
    );

    await assert.rejects(readFile(marker, "utf8"), { code: "ENOENT" });
    const session = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.equal(session.status, "blocked");
    assert.equal(session.flags.blocked_reason, "restore mode requires HERMES_RESTORE_APPROVED=1");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Hermes runner blocks restore mode until restore implementation exists", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    const marker = join(repo, "hermes-restore-marker");
    const { stdout: originalBranch } = await execFileAsync("git", ["branch", "--show-current"], { cwd: repo });
    await writeFile(
      join(repo, ".archaeology", "session.json"),
      `${JSON.stringify({
        runtime: "hermes",
        status: "running",
        current_phase: "site-survey",
        completed_phases: [],
        mode: "restore",
        test_command: `printf test >> ${marker}`,
        typecheck_command: `printf typecheck >> ${marker}`,
        branch_name: "refactor/archaeology",
      })}\n`,
    );

    await assert.rejects(
      execFileAsync("bash", [join(repo, "hooks", "hermes", "runner.sh")], {
        cwd: repo,
        env: { ...process.env, HERMES_RESTORE_APPROVED: "1" },
      }),
      /Hermes restore mode is not implemented/,
    );

    await assert.rejects(readFile(marker, "utf8"), { code: "ENOENT" });
    const { stdout: currentBranch } = await execFileAsync("git", ["branch", "--show-current"], { cwd: repo });
    const session = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.equal(currentBranch, originalBranch);
    assert.equal(session.status, "blocked");
    assert.equal(session.flags.blocked_reason, "restore mode is not implemented in Hermes runner");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode revert hook preserves reverted changes in a named stash", async () => {
  const repo = await makeHookRepo();
  try {
    await writeFile(join(repo, "package.json"), `${JSON.stringify({ scripts: { test: "false" } })}\n`);
    await writeFile(join(repo, "new-artifact.txt"), "preserve me\n");

    await execFileAsync("bash", [join(repo, "hooks", "opencode", "revert-phase.sh"), "test-phase"], {
      cwd: repo,
    });

    const { stdout: status } = await execFileAsync("git", ["status", "--short"], { cwd: repo });
    const { stdout: stashList } = await execFileAsync("git", ["stash", "list"], { cwd: repo });
    const { stdout: stashFiles } = await execFileAsync(
      "git",
      ["stash", "show", "--include-untracked", "--name-only", "stash@{0}"],
      { cwd: repo },
    );

    assert.equal(status, "");
    assert.match(stashList, /code-archaeology-revert-test-phase/);
    assert.match(stashFiles, /package\.json/);
    assert.match(stashFiles, /new-artifact\.txt/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
