import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const DEFAULT_WAVEARY_DATA_DIR = fileURLToPath(new URL("../../.waveary", import.meta.url));

export function getWavearyDataDir(): string {
  const configured = process.env.WAVEARY_DATA_DIR?.trim();

  if (!configured) {
    return DEFAULT_WAVEARY_DATA_DIR;
  }

  return resolve(configured);
}
