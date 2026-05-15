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

test("Hermes runner advances current_phase and appends to completed_phases", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    await writeFile(
      join(repo, ".archaeology", "session.json"),
      `${JSON.stringify({
        runtime: "hermes",
        status: "running",
        current_phase: "dead-code",
        completed_phases: ["site-survey"],
        mode: "survey",
        test_command: "true",
        typecheck_command: "true",
        branch_name: "refactor/archaeology",
      })}\n`,
    );

    const { stdout } = await execFileAsync("bash", [join(repo, "hooks", "hermes", "runner.sh")], {
      cwd: repo,
    });

    const session = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.match(stdout, /Phase dead-code complete/);
    assert.deepEqual(session.completed_phases, ["site-survey", "dead-code"]);
    assert.equal(session.current_phase, "legacy-removal");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Hermes runner refuses symlinked shared sessions without overwriting the target", async () => {
  const repo = await makeHookRepo();
  const victimDir = await mkdtemp(join(tmpdir(), "code-archaeology-victim-"));
  const victim = join(victimDir, "shared-session.json");
  const victimContent = `${JSON.stringify({ version: 1, completed: false })}\n`;
  try {
    await mkdir(join(repo, ".archaeology"));
    await writeFile(victim, victimContent);
    await symlink(victim, join(repo, ".archaeology", "session.json"));

    await assert.rejects(
      execFileAsync("bash", [join(repo, "hooks", "hermes", "runner.sh")], { cwd: repo }),
      /Refusing to use symlinked Hermes session file/,
    );

    const sessionStat = await lstat(join(repo, ".archaeology", "session.json"));
    assert.equal(sessionStat.isSymbolicLink(), true);
    assert.equal(await readFile(victim, "utf8"), victimContent);
  } finally {
    await rm(repo, { recursive: true, force: true });
    await rm(victimDir, { recursive: true, force: true });
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

test("Hermes runner excavate mode writes a mock patch file and advances phase", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    await writeFile(
      join(repo, ".archaeology", "session.json"),
      `${JSON.stringify({
        runtime: "hermes",
        status: "running",
        current_phase: "dead-code",
        completed_phases: ["site-survey"],
        mode: "excavate",
        test_command: "true",
        typecheck_command: "true",
        branch_name: "refactor/archaeology",
      })}\n`,
    );

    const { stdout } = await execFileAsync("bash", [join(repo, "hooks", "hermes", "runner.sh")], {
      cwd: repo,
    });

    const session = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.match(stdout, /EXCAVATE/);
    assert.match(stdout, /Mock patch written/);
    const patchContent = await readFile(
      join(repo, ".archaeology", "patches", "expedition2-mock.patch"),
      "utf8",
    );
    assert.match(patchContent, /dead-code/);
    assert.deepEqual(session.completed_phases, ["site-survey", "dead-code"]);
    assert.equal(session.current_phase, "legacy-removal");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Hermes runner blocks unknown mode without advancing phase", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    await writeFile(
      join(repo, ".archaeology", "session.json"),
      `${JSON.stringify({
        runtime: "hermes",
        status: "running",
        current_phase: "site-survey",
        completed_phases: [],
        mode: "badmode",
        test_command: "true",
        typecheck_command: "true",
        branch_name: "refactor/archaeology",
      })}\n`,
    );

    await assert.rejects(
      execFileAsync("bash", [join(repo, "hooks", "hermes", "runner.sh")], { cwd: repo }),
      /Unknown Hermes mode/,
    );

    const session = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.equal(session.status, "blocked");
    assert.equal(session.flags.blocked_reason, "unknown mode: badmode");
    assert.deepEqual(session.completed_phases, []);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Hermes runner marks session complete after the final phase", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    await writeFile(
      join(repo, ".archaeology", "session.json"),
      `${JSON.stringify({
        runtime: "hermes",
        status: "running",
        current_phase: "final-catalog",
        completed_phases: [
          "site-survey",
          "dead-code",
          "legacy-removal",
          "dependency-mapping",
          "type-consolidation",
          "type-hardening",
          "dry-stratification",
          "error-handling",
          "artifact-cleaning",
        ],
        mode: "survey",
        test_command: "true",
        typecheck_command: "true",
        branch_name: "refactor/archaeology",
      })}\n`,
    );

    const { stdout } = await execFileAsync("bash", [join(repo, "hooks", "hermes", "runner.sh")], {
      cwd: repo,
    });

    const session = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.match(stdout, /ALL PHASES COMPLETE/);
    assert.equal(session.status, "complete");
    assert.equal(session.current_phase, "");
    assert.ok(session.completed_phases.includes("final-catalog"));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Hermes runner exits cleanly when session is already complete", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    const completedSession = {
      runtime: "hermes",
      status: "complete",
      current_phase: "",
      completed_phases: [
        "site-survey",
        "dead-code",
        "legacy-removal",
        "dependency-mapping",
        "type-consolidation",
        "type-hardening",
        "dry-stratification",
        "error-handling",
        "artifact-cleaning",
        "final-catalog",
      ],
      mode: "survey",
      branch_name: "refactor/archaeology",
    };
    await writeFile(
      join(repo, ".archaeology", "session.json"),
      `${JSON.stringify(completedSession)}\n`,
    );

    const { stdout } = await execFileAsync("bash", [join(repo, "hooks", "hermes", "runner.sh")], {
      cwd: repo,
    });

    const session = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.match(stdout, /All Code Archaeology phases are complete/);
    assert.equal(session.status, "complete");
    assert.equal(session.completed_phases.length, 10);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode init hook creates a valid session.json in a clean repository", async () => {
  const repo = await makeHookRepo();
  try {
    const { stdout } = await execFileAsync("bash", [join(repo, "hooks", "opencode", "init.sh")], {
      cwd: repo,
    });

    const { stdout: gitBranch } = await execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: repo });
    const session = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.match(stdout, /Initialized/);
    assert.equal(session.version, 1);
    assert.equal(session.completed, false);
    assert.equal(session.expeditions.length, 10);
    assert.ok(typeof session.session_id === "string" && session.session_id.startsWith("archaeology-"));
    assert.equal(session.total_findings, 0);
    assert.equal(session.config.branch_name, gitBranch.trim());
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode init hook refreshes an existing session.json without resetting it", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    const existing = {
      version: 1,
      plugin_version: "0.0.0",
      session_id: "archaeology-existing",
      updated_at: "2025-01-01T00:00:00Z",
      total_findings: 5,
      completed: false,
    };
    await writeFile(join(repo, ".archaeology", "session.json"), `${JSON.stringify(existing)}\n`);

    const { stdout } = await execFileAsync("bash", [join(repo, "hooks", "opencode", "init.sh")], {
      cwd: repo,
    });

    const session = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.match(stdout, /Refreshed/);
    assert.equal(session.session_id, "archaeology-existing");
    assert.equal(session.total_findings, 5);
    assert.notEqual(session.updated_at, "2025-01-01T00:00:00Z");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode init hook does not follow predictable session temp symlinks when refreshing", async () => {
  const repo = await makeHookRepo();
  const victimDir = await mkdtemp(join(tmpdir(), "code-archaeology-victim-"));
  const victim = join(victimDir, "victim.txt");
  try {
    await mkdir(join(repo, ".archaeology"));
    await writeFile(victim, "do not overwrite\n");
    await symlink(victim, join(repo, ".archaeology", "session.json.tmp"));
    await writeFile(
      join(repo, ".archaeology", "session.json"),
      `${JSON.stringify({ version: 1, updated_at: "2025-01-01T00:00:00Z" })}\n`,
    );

    await execFileAsync("bash", [join(repo, "hooks", "opencode", "init.sh")], {
      cwd: repo,
    });

    assert.equal(await readFile(victim, "utf8"), "do not overwrite\n");
    const session = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.equal(session.version, 1);
  } finally {
    await rm(repo, { recursive: true, force: true });
    await rm(victimDir, { recursive: true, force: true });
  }
});

test("OpenCode init hook refuses symlinked session.json without overwriting the target", async () => {
  const repo = await makeHookRepo();
  const victimDir = await mkdtemp(join(tmpdir(), "code-archaeology-victim-"));
  const victim = join(victimDir, "victim.txt");
  const victimContent = "do not overwrite\n";
  try {
    await mkdir(join(repo, ".archaeology"));
    await writeFile(victim, victimContent);
    await symlink(victim, join(repo, ".archaeology", "session.json"));

    await assert.rejects(
      execFileAsync("bash", [join(repo, "hooks", "opencode", "init.sh")], { cwd: repo }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /Refusing to write to symlinked session file/);
        return true;
      },
    );

    const sessionStat = await lstat(join(repo, ".archaeology", "session.json"));
    assert.equal(sessionStat.isSymbolicLink(), true);
    assert.equal(await readFile(victim, "utf8"), victimContent);
  } finally {
    await rm(repo, { recursive: true, force: true });
    await rm(victimDir, { recursive: true, force: true });
  }
});

test("OpenCode verify hook fails when test command fails", async () => {
  const repo = await makeHookRepo();
  try {
    await assert.rejects(
      execFileAsync("bash", [join(repo, "hooks", "opencode", "verify-phase.sh"), "dead-code"], {
        cwd: repo,
        env: { ...process.env, CODE_ARCHAEOLOGY_TEST_COMMAND: "false" },
      }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /Tests FAILED/);
        return true;
      },
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode verify hook forwards test command stderr output to operator", async () => {
  const repo = await makeHookRepo();
  try {
    await assert.rejects(
      execFileAsync("bash", [join(repo, "hooks", "opencode", "verify-phase.sh"), "dead-code"], {
        cwd: repo,
        env: {
          ...process.env,
          CODE_ARCHAEOLOGY_TEST_COMMAND: "bash -c 'echo \"FAIL: 3 tests failed\" >&2; exit 1'",
        },
      }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /FAIL: 3 tests failed/);
        return true;
      },
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode verify hook fails when typecheck fails", async () => {
  const repo = await makeHookRepo();
  try {
    await assert.rejects(
      execFileAsync("bash", [join(repo, "hooks", "opencode", "verify-phase.sh"), "restore-phase"], {
        cwd: repo,
        env: { ...process.env, CODE_ARCHAEOLOGY_TYPECHECK_COMMAND: "false" },
      }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /Typecheck FAILED/);
        return true;
      },
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode verify hook forwards typecheck stderr output to operator", async () => {
  const repo = await makeHookRepo();
  try {
    await assert.rejects(
      execFileAsync("bash", [join(repo, "hooks", "opencode", "verify-phase.sh"), "restore-phase"], {
        cwd: repo,
        env: {
          ...process.env,
          CODE_ARCHAEOLOGY_TYPECHECK_COMMAND: "bash -c 'echo \"error TS2339: Property does not exist\" >&2; exit 1'",
        },
      }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /error TS2339: Property does not exist/);
        return true;
      },
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode update-expedition hook does not follow predictable session temp symlinks", async () => {
  const repo = await makeHookRepo();
  const victimDir = await mkdtemp(join(tmpdir(), "code-archaeology-victim-"));
  const victim = join(victimDir, "victim.txt");
  try {
    await mkdir(join(repo, ".archaeology"));
    await writeFile(victim, "do not overwrite\n");
    const session = {
      version: 1,
      updated_at: "2025-01-01T00:00:00Z",
      expeditions: [
        { phase: "survey", name: "Site Survey", status: "pending", findings_count: 0 },
      ],
      total_findings: 0,
    };
    await writeFile(join(repo, ".archaeology", "session.json"), `${JSON.stringify(session)}\n`);
    await symlink(victim, join(repo, ".archaeology", "session.json.tmp"));

    await execFileAsync(
      "bash",
      [join(repo, "hooks", "opencode", "update-expedition.sh"), "survey", "complete", "3"],
      { cwd: repo },
    );

    assert.equal(await readFile(victim, "utf8"), "do not overwrite\n");
    const updated = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.equal(updated.expeditions[0].status, "complete");
    assert.equal(updated.expeditions[0].findings_count, 3);
    assert.equal(updated.total_findings, 3);
  } finally {
    await rm(repo, { recursive: true, force: true });
    await rm(victimDir, { recursive: true, force: true });
  }
});

test("OpenCode update-expedition hook refuses symlinked session.json without overwriting the target", async () => {
  const repo = await makeHookRepo();
  const victimDir = await mkdtemp(join(tmpdir(), "code-archaeology-victim-"));
  const victim = join(victimDir, "victim.txt");
  const victimContent = `${JSON.stringify({ version: 1, completed: false })}\n`;
  try {
    await mkdir(join(repo, ".archaeology"));
    await writeFile(victim, victimContent);
    await symlink(victim, join(repo, ".archaeology", "session.json"));

    await assert.rejects(
      execFileAsync(
        "bash",
        [join(repo, "hooks", "opencode", "update-expedition.sh"), "survey", "complete", "3"],
        { cwd: repo },
      ),
      /Refusing to update symlinked session file/,
    );

    const sessionStat = await lstat(join(repo, ".archaeology", "session.json"));
    assert.equal(sessionStat.isSymbolicLink(), true);
    assert.equal(await readFile(victim, "utf8"), victimContent);
  } finally {
    await rm(repo, { recursive: true, force: true });
    await rm(victimDir, { recursive: true, force: true });
  }
});

test("OpenCode update-expedition hook stamps completed_at only when status is complete", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    const session = {
      version: 1,
      updated_at: "2025-01-01T00:00:00Z",
      expeditions: [
        { phase: "survey", name: "Site Survey", status: "pending", findings_count: 0 },
      ],
      total_findings: 0,
    };
    await writeFile(join(repo, ".archaeology", "session.json"), `${JSON.stringify(session)}\n`);

    await execFileAsync(
      "bash",
      [join(repo, "hooks", "opencode", "update-expedition.sh"), "survey", "complete", "5"],
      { cwd: repo },
    );

    const updated = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.equal(updated.expeditions[0].status, "complete");
    assert.ok(
      typeof updated.expeditions[0].completed_at === "string" && updated.expeditions[0].completed_at.length > 0,
      "completed_at should be set for complete status",
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode update-expedition hook does not stamp completed_at for non-complete statuses", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    const session = {
      version: 1,
      updated_at: "2025-01-01T00:00:00Z",
      expeditions: [
        { phase: "survey", name: "Site Survey", status: "pending", findings_count: 0 },
      ],
      total_findings: 0,
    };
    await writeFile(join(repo, ".archaeology", "session.json"), `${JSON.stringify(session)}\n`);

    await execFileAsync(
      "bash",
      [join(repo, "hooks", "opencode", "update-expedition.sh"), "survey", "running", "0"],
      { cwd: repo },
    );

    const updated = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.equal(updated.expeditions[0].status, "running");
    assert.equal(
      updated.expeditions[0].completed_at,
      undefined,
      "completed_at must not be set for non-complete status",
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode update-expedition hook sets completed_at only when status is complete", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    const session = {
      version: 1,
      updated_at: "2025-01-01T00:00:00Z",
      expeditions: [
        { phase: "survey", name: "Site Survey", status: "pending", findings_count: 0 },
      ],
      total_findings: 0,
    };
    await writeFile(join(repo, ".archaeology", "session.json"), `${JSON.stringify(session)}\n`);

    await execFileAsync(
      "bash",
      [join(repo, "hooks", "opencode", "update-expedition.sh"), "survey", "in-progress", "0"],
      { cwd: repo },
    );

    const updated = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.equal(updated.expeditions[0].status, "in-progress");
    assert.equal(updated.expeditions[0].completed_at, undefined);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode update-expedition hook sets completed_at when status is complete", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    const session = {
      version: 1,
      updated_at: "2025-01-01T00:00:00Z",
      expeditions: [
        { phase: "survey", name: "Site Survey", status: "in-progress", findings_count: 0 },
      ],
      total_findings: 0,
    };
    await writeFile(join(repo, ".archaeology", "session.json"), `${JSON.stringify(session)}\n`);

    await execFileAsync(
      "bash",
      [join(repo, "hooks", "opencode", "update-expedition.sh"), "survey", "complete", "7"],
      { cwd: repo },
    );

    const updated = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.equal(updated.expeditions[0].status, "complete");
    assert.equal(updated.expeditions[0].findings_count, 7);
    assert.ok(typeof updated.expeditions[0].completed_at === "string" && updated.expeditions[0].completed_at.length > 0);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode update-expedition hook stamps started_at when status is running", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    const session = {
      version: 1,
      updated_at: "2025-01-01T00:00:00Z",
      expeditions: [
        { phase: "survey", name: "Site Survey", status: "pending", findings_count: 0 },
      ],
      total_findings: 0,
    };
    await writeFile(join(repo, ".archaeology", "session.json"), `${JSON.stringify(session)}\n`);

    await execFileAsync(
      "bash",
      [join(repo, "hooks", "opencode", "update-expedition.sh"), "survey", "running", "0"],
      { cwd: repo },
    );

    const updated = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.equal(updated.expeditions[0].status, "running");
    assert.ok(
      typeof updated.expeditions[0].started_at === "string" && updated.expeditions[0].started_at.length > 0,
      "started_at should be set when status is running",
    );
    assert.equal(updated.expeditions[0].completed_at, undefined, "completed_at must not be set for running status");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("OpenCode update-expedition hook does not stamp started_at for non-running statuses", async () => {
  const repo = await makeHookRepo();
  try {
    await mkdir(join(repo, ".archaeology"));
    const session = {
      version: 1,
      updated_at: "2025-01-01T00:00:00Z",
      expeditions: [
        { phase: "survey", name: "Site Survey", status: "pending", findings_count: 0 },
      ],
      total_findings: 0,
    };
    await writeFile(join(repo, ".archaeology", "session.json"), `${JSON.stringify(session)}\n`);

    await execFileAsync(
      "bash",
      [join(repo, "hooks", "opencode", "update-expedition.sh"), "survey", "complete", "3"],
      { cwd: repo },
    );

    const updated = JSON.parse(await readFile(join(repo, ".archaeology", "session.json"), "utf8"));
    assert.equal(updated.expeditions[0].status, "complete");
    assert.equal(updated.expeditions[0].started_at, undefined, "started_at must not be set for non-running status");
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
