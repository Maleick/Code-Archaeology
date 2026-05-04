import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = process.cwd();

test("AnalysisTool includes every documented language analysis tool", async () => {
  const dir = await mkdtemp(join(tmpdir(), "code-archaeology-types-"));
  try {
    const contractPath = join(dir, "analysis-tool-contract.ts");
    await writeFile(
      contractPath,
      `import type { AnalysisTool } from "${join(root, "src", "types.ts")}";

const documentedTools = [
  "knip",
  "unimported",
  "depcheck",
  "vulture",
  "deadcode",
  "staticcheck",
  "cargo-udeps",
  "rustc",
  "madge",
  "pydeps",
  "godepgraph",
  "cargo-deps",
  "tsc",
  "mypy",
  "go vet",
  "jscpd",
  "pylint",
  "golangci-lint",
  "clippy",
  "ast_grep",
  "manual",
] as const satisfies readonly AnalysisTool[];

void documentedTools;
`,
    );

    await execFileAsync("npx", ["tsc", "--ignoreConfig", "--noEmit", "--module", "NodeNext", "--moduleResolution", "NodeNext", "--target", "ES2022", "--allowImportingTsExtensions", contractPath], {
      cwd: root,
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
