import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const env = { ...process.env };
const args = process.argv.slice(2);
const keyPath = join(homedir(), ".tauri", "quality-life.key");

if (!env.TAURI_SIGNING_PRIVATE_KEY && existsSync(keyPath)) {
  env.TAURI_SIGNING_PRIVATE_KEY = readFileSync(keyPath, "utf8").trim();
}

if (!env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD) {
  env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "";
}

const requestedBundles = args.flatMap((arg, index) => (arg === "--bundles" ? String(args[index + 1] ?? "").split(",") : [])).filter(Boolean);
const windowsOnlyBundles = new Set(["nsis", "msi"]);

if (requestedBundles.some((bundle) => windowsOnlyBundles.has(bundle)) && process.platform !== "win32") {
  console.error(
    "Windows installers need to be built on Windows or a Windows CI runner. This machine is running a different platform, so Tauri cannot produce the requested Windows bundle here."
  );
  process.exit(1);
}

const result = spawnSync("npm", ["exec", "tauri", "--", "build", ...args], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32"
});

process.exit(result.status ?? 1);
