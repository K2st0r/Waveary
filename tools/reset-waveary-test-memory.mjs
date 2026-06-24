import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LOCAL_API_URL =
  process.env.WAVEARY_LOCAL_API_URL?.trim() ||
  "http://127.0.0.1:4173/api/chat/sessions/reset-all";
const CHAT_MEMORY_FILES = [
  "chat-sessions.json",
  "chat-sessions.db",
  "chat-persistence.json"
];

const PRESERVED_CONFIG_FILES = ["provider-config.json", "voice-config.json"];

await main();

async function main() {
  const dataDir = getWavearyDataDir();
  mkdirSync(dataDir, { recursive: true });

  const apiResult = await tryResetThroughLocalApi();
  if (apiResult) {
    console.log(JSON.stringify(apiResult, null, 2));
    return;
  }

  const removed = [];
  const missing = [];
  const blocked = [];
  const preserved = [];

  for (const filename of CHAT_MEMORY_FILES) {
    const targetPath = join(dataDir, filename);

    if (!existsSync(targetPath)) {
      missing.push(relativeWavearyPath(filename));
      continue;
    }

    try {
      rmSync(targetPath, { force: true });
      removed.push(relativeWavearyPath(filename));
    } catch (error) {
      blocked.push({
        path: relativeWavearyPath(filename),
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }

  for (const filename of PRESERVED_CONFIG_FILES) {
    const targetPath = join(dataDir, filename);

    if (existsSync(targetPath)) {
      preserved.push(relativeWavearyPath(filename));
    }
  }

  const summary = {
    dataDir,
    removed,
    missing,
    blocked,
    preserved,
    note: blocked.length
      ? "Some files are still locked. Stop or restart the running Waveary web dev server, then run this command again so SQLite-backed memory can also be cleared."
      : "If a Waveary web dev server is already running, restart it before the next live chat verification so in-memory session cache is also cleared."
  };

  console.log(JSON.stringify(summary, null, 2));
}

async function tryResetThroughLocalApi() {
  try {
    const response = await fetch(LOCAL_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: "{}"
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();

    return {
      mode: "api",
      url: LOCAL_API_URL,
      resetSessionCount: payload.resetSessionCount ?? null,
      defaultSessionId: payload.defaultSessionId ?? null,
      persistenceBackend: payload.persistence?.backend ?? null,
      note: "Cleared test-session memory through the running local Waveary server. Provider and voice config stayed untouched."
    };
  } catch {
    return null;
  }
}

function getWavearyDataDir() {
  const configured = process.env.WAVEARY_DATA_DIR?.trim();

  if (configured) {
    return resolve(configured);
  }

  return join(findWavearyRepoRoot(), ".waveary");
}

function findWavearyRepoRoot() {
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
      return resolve(dirname(fileURLToPath(import.meta.url)), "..");
    }

    currentDir = parentDir;
  }
}

function relativeWavearyPath(filename) {
  return `.waveary/${filename}`;
}
