import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function withPreloadModule(prefix, source, callback) {
  let callbackError;
  const dir = await mkdtemp(join(tmpdir(), prefix));
  const preloadPath = join(dir, "preload.mjs");
  await writeFile(preloadPath, source);
  try {
    return await callback(preloadPath);
  } catch (error) {
    callbackError = error;
    throw error;
  } finally {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch (cleanupError) {
      if (!callbackError) {
        throw cleanupError;
      }
    }
  }
}
