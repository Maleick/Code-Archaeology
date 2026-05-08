import process from "node:process";

export function isWindows(): boolean {
  return process.platform === "win32";
}
