import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, beforeEach, test } from "node:test";

const TEST_DATA_DIR = mkdtempSync(join(tmpdir(), "waveary-web-persistence-"));
process.env.WAVEARY_DATA_DIR = TEST_DATA_DIR;

const {
  DEFAULT_CHAT_SESSION_ID,
  createChatSession,
  getCurrentChatPersistenceStatus,
  listChatSessions,
  PersistentChatSessionState,
  switchChatPersistenceBackend
} = await import("./chat-session-store.js");
const {
  createDefaultChatPersistenceConfig,
  CHAT_SESSION_JSON_PATH,
  CHAT_SESSION_SQLITE_PATH,
  saveChatPersistenceConfig
} = await import("./chat-persistence-config.js");

after(() => {
  try {
    saveChatPersistenceConfig(createDefaultChatPersistenceConfig());
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  } catch {
    // Ignore Windows file-lock timing during final test cleanup.
  }
});

beforeEach(() => {
  rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  saveChatPersistenceConfig(createDefaultChatPersistenceConfig());
});

test("chat persistence switching imports file sessions into sqlite and preserves the default session", () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);
  const created = createChatSession("session-alpha", "Alpha Session");

  const fileSnapshot = new PersistentChatSessionState(created.sessionId).getSnapshot();
  assert.ok(fileSnapshot);
  assert.equal(fileSnapshot.messages.length, 0);

  const switched = switchChatPersistenceBackend("sqlite");

  assert.equal(switched.persistence.backend, "sqlite");
  assert.equal(switched.importedSessionCount, 2);
  assert.equal(switched.persistence.lastSync.fromBackend, "file");
  assert.equal(switched.persistence.lastSync.toBackend, "sqlite");
  assert.equal(switched.persistence.lastSync.synchronizedSessionCount, 2);
  assert.equal(existsSync(CHAT_SESSION_JSON_PATH), true);
  assert.equal(existsSync(CHAT_SESSION_SQLITE_PATH), true);
  assert.equal(
    switched.persistence.backendDetails.find((detail) => detail.backend === "sqlite")?.syncState,
    "active"
  );
  assert.equal(
    switched.persistence.backendDetails.find((detail) => detail.backend === "file")?.syncState,
    "in-sync"
  );

  const sessions = listChatSessions();
  assert.deepEqual(
    sessions.map((session) => session.sessionId).sort(),
    [DEFAULT_CHAT_SESSION_ID, "session-alpha"].sort()
  );

  switchChatPersistenceBackend("file");
});

test("chat persistence switching syncs newer session state back from sqlite to file", () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);
  createChatSession("session-sync", "Sync Session");
  switchChatPersistenceBackend("sqlite");

  const sqliteUpdatedAt = new Date(Date.now() + 1000).toISOString();

  const sessionState = new PersistentChatSessionState("session-sync");
  const context = sessionState.getContext();
  context.history = [
    {
      id: "user-sync-1",
      sessionId: "session-sync",
      role: "user",
      content: "sync this newer sqlite state",
      timestamp: sqliteUpdatedAt,
      metadata: {}
    }
  ];

  sessionState.saveTurn(context, {
    reply: "synced",
    relationship: {
      userId: "user-web-1",
      stage: "new",
      affinityScore: 0.2,
      trustScore: 0.2,
      stabilityScore: 0.5,
      lastUpdatedAt: sqliteUpdatedAt
    },
    recalledMemories: [],
    storedMemories: [],
    timeline: []
  });

  const switchedBack = switchChatPersistenceBackend("file");

  assert.equal(switchedBack.persistence.backend, "file");
  assert.equal(switchedBack.importedSessionCount, 1);
  assert.equal(switchedBack.persistence.lastSync.fromBackend, "sqlite");
  assert.equal(switchedBack.persistence.lastSync.toBackend, "file");
  assert.equal(switchedBack.persistence.lastSync.synchronizedSessionCount, 1);

  const restored = new PersistentChatSessionState("session-sync").getSnapshot();
  assert.ok(restored);
  assert.equal(restored.messages.length, 1);
  assert.equal(restored.messages[0]?.content, "sync this newer sqlite state");
  assert.equal(getCurrentChatPersistenceStatus().backend, "file");
  assert.equal(
    getCurrentChatPersistenceStatus().backendDetails.find((detail) => detail.backend === "sqlite")?.syncState,
    "in-sync"
  );
});
