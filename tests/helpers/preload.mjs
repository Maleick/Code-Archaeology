import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function withPreloadModule(prefix, source, callback) {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  const preloadPath = join(dir, "preload.mjs");
  await writeFile(preloadPath, source);
  try {
    return await callback(preloadPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
