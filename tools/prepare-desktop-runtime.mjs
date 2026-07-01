import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDir = resolve(rootDir, "waveary-desktop", "app-runtime");

const requiredPaths = [
  resolve(rootDir, "waveary-core", "dist"),
  resolve(rootDir, "waveary-memory", "dist"),
  resolve(rootDir, "waveary-voice", "dist"),
  resolve(rootDir, "waveary-web", "dist"),
  resolve(rootDir, "waveary-web", "dist-server"),
  resolve(rootDir, "waveary-web", "server", "standalone-server.mjs"),
  resolve(rootDir, "docs", "examples", "session-export.sample.json")
];

for (const requiredPath of requiredPaths) {
  if (!existsSync(requiredPath)) {
    throw new Error(`Desktop runtime preparation is missing required path: ${requiredPath}`);
  }
}

rmSync(runtimeDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
mkdirSync(runtimeDir, { recursive: true });

copyWorkspaceRuntime("@waveary/core", "waveary-core");
copyWorkspaceRuntime("@waveary/memory", "waveary-memory");
copyWorkspaceRuntime("@waveary/voice", "waveary-voice");

copyNodeModule("openai");
copyNodeModule("playwright");
copyNodeModule("playwright-core");

copyPath(
  resolve(rootDir, "waveary-web", "dist"),
  resolve(runtimeDir, "waveary-web", "dist")
);
copyPath(
  resolve(rootDir, "waveary-web", "dist-server"),
  resolve(runtimeDir, "waveary-web", "dist-server")
);
copyPath(
  resolve(rootDir, "waveary-web", "server", "standalone-server.mjs"),
  resolve(runtimeDir, "waveary-web", "server", "standalone-server.mjs")
);
copyPath(
  resolve(rootDir, "docs", "examples", "session-export.sample.json"),
  resolve(runtimeDir, "docs", "examples", "session-export.sample.json")
);
copyPath(
  resolve(rootDir, "docs", "session-file-format.md"),
  resolve(runtimeDir, "docs", "session-file-format.md")
);

console.log(`Prepared Waveary desktop runtime at ${runtimeDir}`);

function copyWorkspaceRuntime(packageName, workspaceFolderName) {
  copyPath(
    resolve(rootDir, workspaceFolderName, "package.json"),
    resolve(runtimeDir, "node_modules", ...packageName.split("/"), "package.json")
  );
  copyPath(
    resolve(rootDir, workspaceFolderName, "dist"),
    resolve(runtimeDir, "node_modules", ...packageName.split("/"), "dist")
  );
}

function copyNodeModule(moduleName) {
  copyPath(
    resolve(rootDir, "node_modules", ...moduleName.split("/")),
    resolve(runtimeDir, "node_modules", ...moduleName.split("/"))
  );
}

function copyPath(sourcePath, targetPath) {
  mkdirSync(dirname(targetPath), { recursive: true });
  cpSync(sourcePath, targetPath, {
    recursive: true,
    force: true,
    preserveTimestamps: true
  });
}
