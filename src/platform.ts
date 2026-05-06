import process from "node:process";

export function isWindows(): boolean {
  return process.platform === "win32";
}

export function getHookExtension(): string {
  return isWindows() ? ".ps1" : ".sh";
}

export function getShellCommand(): string {
  return isWindows() ? "powershell.exe" : "bash";
}
