#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const readText = (path) => readFile(new URL(path, import.meta.url), "utf8");
const writeText = (path, content) => writeFile(new URL(path, import.meta.url), content, "utf8");

const packageJson = JSON.parse(await readText("../package.json"));
const version = packageJson.version;

if (typeof version !== "string" || version.length === 0) {
  throw new Error("package.json version is missing");
}

await writeText("../VERSION", `${version}\n`);
