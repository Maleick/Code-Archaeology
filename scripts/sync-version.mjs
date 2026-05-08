#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const readText = (path) => readFile(new URL(path, import.meta.url), "utf8");
const writeText = (path, content) => writeFile(new URL(path, import.meta.url), content, "utf8");

export async function syncVersion() {
  const packageJson = JSON.parse(await readText("../package.json"));
  const version = packageJson.version;

  if (typeof version !== "string" || version.length === 0) {
    throw new Error("package.json version is missing");
  }

  await writeText("../VERSION", `${version}\n`);
}

export async function prepare() {
  await syncVersion();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await syncVersion();
}
