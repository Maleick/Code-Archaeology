import process from "node:process";
export function isWindows() {
    return process.platform === "win32";
}
export function getHookExtension() {
    return isWindows() ? ".ps1" : ".sh";
}
export function getShellCommand() {
    return isWindows() ? "powershell.exe" : "bash";
}
//# sourceMappingURL=platform.js.map