import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const DEFAULT_WAVEARY_DATA_DIR = resolve(findWavearyRepoRoot(), ".waveary");

export function getWavearyDataDir(): string {
  const configured = process.env.WAVEARY_DATA_DIR?.trim();

  if (!configured) {
    return DEFAULT_WAVEARY_DATA_DIR;
  }

  return resolve(configured);
}

function findWavearyRepoRoot(): string {
  if (existsSync(resolve(process.cwd(), "PROJECT_STATE.md"))) {
    return process.cwd();
  }

  let currentDir = dirname(fileURLToPath(import.meta.url));

  while (true) {
    if (existsSync(resolve(currentDir, "PROJECT_STATE.md"))) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
    }

    currentDir = parentDir;
  }
}
