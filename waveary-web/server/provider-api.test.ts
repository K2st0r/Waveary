import assert from "node:assert/strict";
import type { IncomingMessage, ServerResponse } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { Readable } from "node:stream";

const TEST_DATA_DIR = mkdtempSync(join(tmpdir(), "waveary-web-provider-api-"));
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
    saveChatPersistenceConfig(createDefaultChatPersistenceConfig());
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  } catch {
    // Ignore final cleanup timing issues on Windows.
  }
});

beforeEach(() => {
  resetChatRuntimeSessions();
  rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  saveChatPersistenceConfig(createDefaultChatPersistenceConfig());
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
