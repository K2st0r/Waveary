import { cpSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const desktopDir = resolve(rootDir, "waveary-desktop");
const appRuntimeDir = resolve(desktopDir, "app-runtime");
const unpackedDir = resolve(desktopDir, "dist", "win-unpacked");
const unpackedRuntimeDir = resolve(unpackedDir, "resources", "app", "app-runtime");
const unpackedMainDir = resolve(unpackedDir, "resources", "app", "src");
const electronBuilderCli = resolve(rootDir, "node_modules", "electron-builder", "cli.js");

await runStep(
  "electron-builder --dir",
  process.execPath,
  [electronBuilderCli, "--dir"],
  desktopDir
).catch((error) => {
  if (!existsSync(unpackedDir)) {
    throw error;
  }

  console.warn(
    `Desktop unpacked build failed, but an existing win-unpacked bundle is present. ` +
      `Falling back to prepackaged installer build. Root cause: ${error.message}`
  );
});

if (!existsSync(unpackedDir)) {
  throw new Error("Desktop installer fallback could not find win-unpacked output.");
}

if (!existsSync(appRuntimeDir)) {
  throw new Error("Desktop app-runtime is missing. Run desktop preparation first.");
}

cpSync(appRuntimeDir, unpackedRuntimeDir, {
  recursive: true,
  force: true,
  preserveTimestamps: true
});
cpSync(resolve(desktopDir, "src"), unpackedMainDir, {
  recursive: true,
  force: true,
  preserveTimestamps: true
});

await runStep(
  "electron-builder --win nsis --prepackaged",
  process.execPath,
  [
    electronBuilderCli,
    "--win",
    "nsis",
    "--prepackaged",
    unpackedDir,
    "--projectDir",
    desktopDir
  ],
  rootDir
);

function runStep(label, command, args, cwd) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: false
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${label} exited with code ${code ?? "unknown"}.`));
    });

    child.on("error", (error) => {
      rejectPromise(error);
    });
  });
}
