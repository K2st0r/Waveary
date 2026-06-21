import assert from "node:assert/strict";
import type { IncomingMessage, ServerResponse } from "node:http";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { Readable } from "node:stream";

const TEST_ROOT_DIR = mkdtempSync(join(tmpdir(), "waveary-web-provider-api-"));
const TEST_DATA_DIR = join(TEST_ROOT_DIR, "data");
process.env.WAVEARY_DATA_DIR = TEST_DATA_DIR;

const { createProviderApiMiddleware } = await import("./provider-api.js");
const {
  createDefaultChatPersistenceConfig,
  saveChatPersistenceConfig
} = await import("./chat-persistence-config.js");
const { createChatSession, DEFAULT_CHAT_SESSION_ID } = await import("./chat-session-store.js");
const { saveProviderConfig } = await import("./provider-config.js");
const { resetChatRuntimeSessions } = await import("./chat-runtime.js");

const originalFetch = globalThis.fetch;

after(() => {
  globalThis.fetch = originalFetch;

  try {
    resetChatRuntimeSessions();
    resetTestDataDir();
    rmSync(TEST_ROOT_DIR, { recursive: true, force: true });
  } catch {
    // Ignore final cleanup timing issues on Windows.
  }
});

beforeEach(() => {
  resetChatRuntimeSessions();
  resetTestDataDir();
  globalThis.fetch = originalFetch;
});

test("chat persistence route returns rich backend status after switching to sqlite", async () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);
  createChatSession("session-alpha", "Alpha Session");

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/persistence", {
    backend: "sqlite"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.importedSessionCount, 2);
  assert.equal(response.body.defaultSessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.persistence.backend, "sqlite");
  assert.equal(response.body.persistence.lastSync.fromBackend, "file");
  assert.equal(response.body.persistence.lastSync.toBackend, "sqlite");
  assert.equal(response.body.persistence.lastSync.synchronizedSessionCount, 2);
  assert.equal(response.body.sessions.length, 2);
  assert.deepEqual(
    response.body.sessions.map((session: { sessionId: string }) => session.sessionId).sort(),
    [DEFAULT_CHAT_SESSION_ID, "session-alpha"].sort()
  );

  const sqliteStatus = response.body.persistence.backendDetails.find(
    (detail: { backend: string }) => detail.backend === "sqlite"
  );
  const fileStatus = response.body.persistence.backendDetails.find(
    (detail: { backend: string }) => detail.backend === "file"
  );

  assert.ok(sqliteStatus);
  assert.ok(fileStatus);
  assert.equal(sqliteStatus.syncState, "active");
  assert.equal(fileStatus.syncState, "in-sync");
  assert.equal(fileStatus.differingSessionCount, 0);
});

test("chat persistence route resets runtime cache before the next turn", async () => {
  const fetchCalls: Array<{ url: string; model: string }> = [];

  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) as { model?: string } : {};
    fetchCalls.push({
      url,
      model: body.model ?? "unknown"
    });

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: `reply:${body.model ?? "unknown"}`
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }) as typeof fetch;

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  const middleware = createProviderApiMiddleware();

  const firstTurn = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "first turn"
  });

  assert.equal(firstTurn.statusCode, 200);
  assert.equal(firstTurn.body.reply, "reply:model-a");

  saveProviderConfig({
    provider: "provider-b",
    baseURL: "https://provider-b.example/v1",
    apiKey: "key-b",
    model: "model-b"
  });

  const switchResponse = await invokeJsonRoute(middleware, "POST", "/api/chat/persistence", {
    backend: "sqlite"
  });

  assert.equal(switchResponse.statusCode, 200);
  assert.equal(switchResponse.body.persistence.backend, "sqlite");

  const secondTurn = await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "second turn"
  });

  assert.equal(secondTurn.statusCode, 200);
  assert.equal(secondTurn.body.reply, "reply:model-b");
  assert.equal(fetchCalls.length, 2);
  assert.equal(fetchCalls[0]?.url, "https://provider-a.example/v1/chat/completions");
  assert.equal(fetchCalls[0]?.model, "model-a");
  assert.equal(fetchCalls[1]?.url, "https://provider-b.example/v1/chat/completions");
  assert.equal(fetchCalls[1]?.model, "model-b");
});

test("chat sessions route lists sessions with default session and persistence status", async () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);
  createChatSession("session-alpha", "Alpha Session");

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "GET", "/api/chat/sessions");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.defaultSessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.persistence.backend, "file");
  assert.equal(response.body.sessions.length, 2);
  assert.deepEqual(
    response.body.sessions.map((session: { sessionId: string }) => session.sessionId).sort(),
    [DEFAULT_CHAT_SESSION_ID, "session-alpha"].sort()
  );
});

test("chat session route returns the requested persisted snapshot", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "remembered reply"
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "Please remember this route-level session test."
  });

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.session.sessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.session.messages.length, 2);
  assert.equal(response.body.session.messages[0]?.content, "Please remember this route-level session test.");
  assert.equal(response.body.session.messages[1]?.content, "remembered reply");
  assert.equal(response.body.session.memoryArchive.length, 1);
  assert.equal(
    response.body.session.memoryArchive[0]?.content,
    "Please remember this route-level session test."
  );
  assert.equal(response.body.session.relationship.stage, "new");
  assert.equal(response.body.session.relationship.affinityScore, 0.28);
  assert.equal(response.body.session.relationship.trustScore, 0.26);
  assert.equal(response.body.session.timelineEvents.length, 1);
  assert.equal(
    response.body.session.timelineEvents[0]?.description,
    "Please remember this route-level session test."
  );
});

test("chat session export route returns a structured export package for the active session", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "export reply"
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "Please export this session memory package."
  });

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/export", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.exported.schemaVersion, "waveary-session@1");
  assert.equal(response.body.exported.sessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.exported.title, "Main Companion Session");
  assert.equal(response.body.exported.snapshot.messages.length, 2);
  assert.equal(response.body.exported.snapshot.memoryArchive.length, 1);
  assert.equal(response.body.exported.snapshot.timelineEvents.length, 1);
  assert.equal(
    response.body.exported.snapshot.memoryArchive[0]?.content,
    "Please export this session memory package."
  );
});

test("chat session import route restores an exported package as a new session", async () => {
  const middleware = createProviderApiMiddleware();

  const exported = {
    schemaVersion: "waveary-session@1",
    exportedAt: "2026-06-20T00:00:00.000Z",
    sessionId: "session-original",
    title: "Imported Reflection Session",
    snapshot: {
      sessionId: "session-original",
      messages: [
        {
          id: "user-1",
          role: "user",
          content: "I want to preserve this imported reflection.",
          sessionId: "session-original"
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "This session is now ready to be imported.",
          sessionId: "session-original"
        }
      ],
      latestInsights: null,
      memoryArchive: [
        {
          id: "memory-1",
          type: "reflection",
          content: "I want to preserve this imported reflection.",
          importance: 0.7,
          createdAt: "2026-06-20T00:00:00.000Z"
        }
      ],
      relationship: {
        stage: "growing",
        affinityScore: 0.55,
        trustScore: 0.51,
        stabilityScore: 0.62,
        lastUpdatedAt: "2026-06-20T00:00:00.000Z"
      },
      timelineEvents: [
        {
          id: "timeline-1",
          title: "Imported reflection",
          description: "I want to preserve this imported reflection.",
          type: "reflection",
          eventTime: "2026-06-20T00:00:00.000Z",
          importance: 0.7
        }
      ],
      updatedAt: "2026-06-20T00:00:00.000Z"
    }
  };

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported,
    title: "Recovered Session"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.imported.importedFromSessionId, "session-original");
  assert.equal(response.body.imported.importedTitle, "Recovered Session");
  assert.notEqual(response.body.imported.session.sessionId, "session-original");
  assert.equal(response.body.imported.session.messages.length, 2);
  assert.equal(response.body.imported.session.memoryArchive.length, 1);
  assert.equal(response.body.imported.session.timelineEvents.length, 1);
  assert.equal(
    response.body.sessions.some((session: { title: string }) => session.title === "Recovered Session"),
    true
  );
});

test("chat session import route returns validation details for malformed packages", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported: {
      exportedAt: "",
      title: "",
      snapshot: {
        latestInsights: undefined,
        relationship: undefined,
        messages: [{}],
        memoryArchive: [{}],
        timelineEvents: [{}]
      }
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Exported session package failed validation.");
  assert.deepEqual(response.body.details, [
    "Missing `sessionId`.",
    "Missing `exportedAt`.",
    "Missing `title`.",
    "Missing `snapshot.updatedAt`.",
    "Missing `snapshot.latestInsights`.",
    "Missing `snapshot.relationship`.",
    "Message 1 is missing a string `role`.",
    "Message 1 is missing a string `content`.",
    "Memory item 1 is missing a string `type`.",
    "Memory item 1 is missing a string `content`.",
    "Memory item 1 is missing a numeric `importance`.",
    "Memory item 1 is missing a string `createdAt`.",
    "Timeline event 1 is missing a string `title`.",
    "Timeline event 1 is missing a string `description`.",
    "Timeline event 1 is missing a string `type`.",
    "Timeline event 1 is missing a string `eventTime`.",
    "Timeline event 1 is missing a numeric `importance`."
  ]);
});

test("chat session import route accepts legacy packages without schemaVersion", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported: {
      exportedAt: "2026-06-20T00:00:00.000Z",
      sessionId: "legacy-session",
      title: "Legacy Session",
      snapshot: {
        sessionId: "legacy-session",
        messages: [
          {
            id: "user-1",
            role: "user",
            content: "This package was exported before schema versions existed.",
            sessionId: "legacy-session"
          }
        ],
        latestInsights: null,
        memoryArchive: [],
        relationship: null,
        timelineEvents: [],
        updatedAt: "2026-06-20T00:00:00.000Z"
      }
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.imported.importedFromSessionId, "legacy-session");
  assert.equal(response.body.imported.session.messages.length, 1);
});

test("chat session import route rejects unsupported schema versions", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported: {
      schemaVersion: "waveary-session@2",
      exportedAt: "2026-06-20T00:00:00.000Z",
      sessionId: "future-session",
      title: "Future Session",
      snapshot: {
        sessionId: "future-session",
        messages: [],
        latestInsights: null,
        memoryArchive: [],
        relationship: null,
        timelineEvents: [],
        updatedAt: "2026-06-20T00:00:00.000Z"
      }
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Exported session package failed validation.");
  assert.deepEqual(response.body.details, [
    "Unsupported `schemaVersion` \"waveary-session@2\". Supported version: `waveary-session@1`."
  ]);
});

test("chat session import route rejects malformed relationship and latest insights payloads", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported: {
      schemaVersion: "waveary-session@1",
      exportedAt: "2026-06-20T00:00:00.000Z",
      sessionId: "broken-signals",
      title: "Broken Signals",
      snapshot: {
        sessionId: "broken-signals",
        messages: [],
        latestInsights: {
          reply: 123,
          relationship: {
            stage: 7,
            affinityScore: "high",
            trustScore: null,
            stabilityScore: "steady"
          },
          recalledMemories: [42],
          storedMemories: [true],
          timeline: [{}],
          emotion: {
            primaryEmotion: 8,
            intensity: "strong"
          }
        },
        memoryArchive: [],
        relationship: {
          stage: 7,
          affinityScore: "high",
          trustScore: null,
          stabilityScore: "steady"
        },
        timelineEvents: [],
        updatedAt: "2026-06-20T00:00:00.000Z"
      }
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Exported session package failed validation.");
  assert.deepEqual(response.body.details, [
    "`snapshot.latestInsights.reply` must be a string.",
    "`snapshot.latestInsights.relationship.stage` must be a string.",
    "`snapshot.latestInsights.relationship.affinityScore` must be a number.",
    "`snapshot.latestInsights.relationship.trustScore` must be a number.",
    "`snapshot.latestInsights.relationship.stabilityScore` must be a number.",
    "`snapshot.latestInsights.relationship.lastUpdatedAt` must be a string.",
    "Recalled memory 1 in `snapshot.latestInsights.recalledMemories` must be a string.",
    "Stored memory 1 in `snapshot.latestInsights.storedMemories` must be a string.",
    "Latest insight timeline entry 1 is missing a string `title`.",
    "Latest insight timeline entry 1 is missing a string `type`.",
    "Latest insight timeline entry 1 is missing a string `eventTime`.",
    "`snapshot.latestInsights.emotion.primaryEmotion` must be a string.",
    "`snapshot.latestInsights.emotion.intensity` must be a number.",
    "`snapshot.relationship.stage` must be a string.",
    "`snapshot.relationship.affinityScore` must be a number.",
    "`snapshot.relationship.trustScore` must be a number.",
    "`snapshot.relationship.stabilityScore` must be a number.",
    "`snapshot.relationship.lastUpdatedAt` must be a string."
  ]);
});

test("chat session import route rejects invalid timestamps, roles, and score ranges", async () => {
  const middleware = createProviderApiMiddleware();

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/session/import", {
    exported: {
      schemaVersion: "waveary-session@1",
      exportedAt: "not-a-time",
      sessionId: "bad-values",
      title: "Bad Values",
      snapshot: {
        sessionId: "bad-values",
        messages: [
          {
            id: "system-1",
            role: "system",
            content: "unsupported role",
            sessionId: "bad-values"
          }
        ],
        latestInsights: {
          reply: "still here",
          relationship: {
            stage: "growing",
            affinityScore: 1.5,
            trustScore: -0.1,
            stabilityScore: 2,
            lastUpdatedAt: "yesterday"
          },
          recalledMemories: [],
          storedMemories: [],
          timeline: [
            {
              title: "Bad timeline time",
              type: "reflection",
              eventTime: "soon"
            }
          ],
          emotion: {
            primaryEmotion: "calm",
            intensity: 1.2
          }
        },
        memoryArchive: [
          {
            id: "memory-1",
            type: "reflection",
            content: "bad importance",
            importance: 1.4,
            createdAt: "later"
          }
        ],
        relationship: {
          stage: "growing",
          affinityScore: 1.1,
          trustScore: -0.4,
          stabilityScore: 5,
          lastUpdatedAt: "tomorrow"
        },
        timelineEvents: [
          {
            id: "timeline-1",
            title: "Bad score",
            description: "Bad score and time",
            type: "reflection",
            eventTime: "eventually",
            importance: -1
          }
        ],
        updatedAt: "invalid-updated-at"
      }
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Exported session package failed validation.");
  assert.deepEqual(response.body.details, [
    "`exportedAt` must be a valid ISO timestamp.",
    "`snapshot.updatedAt` must be a valid ISO timestamp.",
    "`snapshot.latestInsights.relationship.affinityScore` must be between 0 and 1.",
    "`snapshot.latestInsights.relationship.trustScore` must be between 0 and 1.",
    "`snapshot.latestInsights.relationship.stabilityScore` must be between 0 and 1.",
    "`snapshot.latestInsights.relationship.lastUpdatedAt` must be a valid ISO timestamp.",
    "Latest insight timeline entry 1 `eventTime` must be a valid ISO timestamp.",
    "`snapshot.latestInsights.emotion.intensity` must be between 0 and 1.",
    "`snapshot.relationship.affinityScore` must be between 0 and 1.",
    "`snapshot.relationship.trustScore` must be between 0 and 1.",
    "`snapshot.relationship.stabilityScore` must be between 0 and 1.",
    "`snapshot.relationship.lastUpdatedAt` must be a valid ISO timestamp.",
    "Message 1 has unsupported `role` \"system\". Supported roles: `user`, `assistant`.",
    "Memory item 1 `importance` must be between 0 and 1.",
    "Memory item 1 `createdAt` must be a valid ISO timestamp.",
    "Timeline event 1 `eventTime` must be a valid ISO timestamp.",
    "Timeline event 1 `importance` must be between 0 and 1."
  ]);
});

test("chat session format route returns import safety guidance and sample package", async () => {
  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "GET", "/api/chat/session/format");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.reference.currentSchemaVersion, "waveary-session@1");
  assert.equal(response.body.reference.importMode, "new-session-only");
  assert.equal(response.body.reference.docs.formatPath, "docs/session-file-format.md");
  assert.equal(response.body.reference.docs.samplePath, "docs/examples/session-export.sample.json");
  assert.deepEqual(response.body.reference.topLevelFields, [
    "schemaVersion",
    "exportedAt",
    "sessionId",
    "title",
    "snapshot"
  ]);
  assert.equal(response.body.reference.sample.schemaVersion, "waveary-session@1");
  assert.deepEqual(response.body.reference.requiredSnapshotCollections, [
    "messages",
    "memoryArchive",
    "timelineEvents"
  ]);
  assert.equal(response.body.reference.sample.sessionId, "waveary-main");
  assert.equal(response.body.reference.sample.title, "Main Companion Session");
  assert.equal(response.body.reference.sample.snapshot.messages.length, 2);
});

test("chat session rename route updates non-default sessions and keeps persistence payload", async () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);
  createChatSession("session-rename", "Before Rename");

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/sessions/rename", {
    sessionId: "session-rename",
    title: "After Rename"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.defaultSessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.persistence.backend, "file");
  assert.equal(response.body.session.sessionId, "session-rename");
  assert.equal(
    response.body.sessions.find((session: { sessionId: string }) => session.sessionId === "session-rename")?.title,
    "After Rename"
  );
});

test("chat session rename route rejects the default session", async () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/sessions/rename", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    title: "Should Fail"
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "The default main session cannot be renamed.");
});

test("chat session delete route removes optional sessions and preserves the default session", async () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);
  createChatSession("session-delete", "Delete Me");

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/sessions/delete", {
    sessionId: "session-delete"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.defaultSessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.persistence.backend, "file");
  assert.deepEqual(
    response.body.sessions.map((session: { sessionId: string }) => session.sessionId),
    [DEFAULT_CHAT_SESSION_ID]
  );
});

test("chat session delete route rejects deleting the default session", async () => {
  createChatSession(DEFAULT_CHAT_SESSION_ID);

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/sessions/delete", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "The default main session cannot be deleted.");
});

test("chat session reset route clears the active session while preserving it in the session list", async () => {
  const middleware = createProviderApiMiddleware();

  saveProviderConfig({
    provider: "provider-a",
    baseURL: "https://provider-a.example/v1",
    apiKey: "key-a",
    model: "model-a"
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "reset me"
            }
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  await invokeJsonRoute(middleware, "POST", "/api/chat/turn", {
    sessionId: DEFAULT_CHAT_SESSION_ID,
    message: "Please create some history before reset."
  });

  const response = await invokeJsonRoute(middleware, "POST", "/api/chat/sessions/reset", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.defaultSessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.session.sessionId, DEFAULT_CHAT_SESSION_ID);
  assert.equal(response.body.session.messages.length, 0);
  assert.equal(response.body.session.latestInsights, null);
  assert.equal(response.body.session.memoryArchive.length, 0);
  assert.equal(response.body.session.relationship, null);
  assert.equal(response.body.session.timelineEvents.length, 0);
  assert.equal(
    response.body.sessions.some((session: { sessionId: string }) => session.sessionId === DEFAULT_CHAT_SESSION_ID),
    true
  );

  const restored = await invokeJsonRoute(middleware, "POST", "/api/chat/session", {
    sessionId: DEFAULT_CHAT_SESSION_ID
  });

  assert.equal(restored.statusCode, 200);
  assert.equal(restored.body.session.messages.length, 0);
  assert.equal(restored.body.session.latestInsights, null);
  assert.equal(restored.body.session.memoryArchive.length, 0);
  assert.equal(restored.body.session.relationship, null);
  assert.equal(restored.body.session.timelineEvents.length, 0);
});

test("provider models route returns normalized provider models for the browser flow", async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        models: [
          "deepseek-chat",
          {
            name: "qwen-turbo",
            display_name: "Qwen Turbo",
            context_length: 131072
          },
          {
            id: "qwen-turbo",
            label: "Duplicate"
          }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )) as typeof fetch;

  const middleware = createProviderApiMiddleware();
  const response = await invokeJsonRoute(middleware, "POST", "/api/provider/models", {
    provider: "dashscope",
    baseURL: "https://provider.example/v1",
    apiKey: "test-key"
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.models, [
    { id: "deepseek-chat", provider: "dashscope" },
    {
      id: "qwen-turbo",
      provider: "dashscope",
      label: "Qwen Turbo",
      contextWindow: 131072
    }
  ]);
});

async function invokeJsonRoute(
  middleware: ReturnType<typeof createProviderApiMiddleware>,
  method: string,
  url: string,
  payload?: unknown
): Promise<{ statusCode: number; body: any }> {
  const request = createJsonRequest(method, url, payload);
  const response = createResponseCapture();

  await middleware(request, response.serverResponse, (error?: unknown) => {
    if (error) {
      throw error;
    }
  });

  return {
    statusCode: response.serverResponse.statusCode,
    body: response.getBody() ? (JSON.parse(response.getBody()) as any) : {}
  };
}

function createJsonRequest(
  method: string,
  url: string,
  payload?: unknown
): IncomingMessage {
  const rawBody = payload === undefined ? "" : JSON.stringify(payload);
  const request = Readable.from(rawBody ? [rawBody] : []) as Readable & Partial<IncomingMessage>;

  request.method = method;
  request.url = url;
  request.headers = {
    "content-type": "application/json"
  };

  return request as IncomingMessage;
}

function createResponseCapture(): {
  serverResponse: ServerResponse;
  getBody: () => string;
} {
  const capture = {
    body: ""
  };

  const response = {
    statusCode: 200,
    setHeader() {
      return this;
    },
    end(chunk?: string | Buffer) {
      if (chunk) {
        capture.body += chunk.toString();
      }

      return this;
    }
  } as Partial<ServerResponse>;

  return {
    serverResponse: response as unknown as ServerResponse,
    getBody: () => capture.body
  };
}

function resetTestDataDir(): void {
  mkdirSync(TEST_DATA_DIR, { recursive: true });
  rmSync(join(TEST_DATA_DIR, "chat-sessions.json"), { force: true });
  rmSync(join(TEST_DATA_DIR, "chat-sessions.db"), { force: true });
  rmSync(join(TEST_DATA_DIR, "chat-persistence.json"), { force: true });
  rmSync(join(TEST_DATA_DIR, "provider-config.json"), { force: true });
  saveChatPersistenceConfig(createDefaultChatPersistenceConfig());
}
