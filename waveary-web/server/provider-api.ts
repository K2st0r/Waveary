import type { IncomingMessage, ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { OpenAICompatibleChatProvider, PROVIDER_PRESETS } from "@waveary/core";

import {
  loadChatSessionSnapshot,
  resetChatRuntimeSessions,
  sendChatTurn
} from "./chat-runtime.js";
import {
  CHAT_SESSION_SCHEMA_VERSION,
  ChatSessionImportValidationError,
  createChatSession,
  exportChatSession,
  getCurrentChatPersistenceStatus,
  importChatSession,
  type ChatPersistenceSwitchResult,
  DEFAULT_CHAT_SESSION_ID,
  deleteChatSession,
  listChatSessions,
  resetChatSession,
  renameChatSession,
  switchChatPersistenceBackend
} from "./chat-session-store.js";
import type { ChatPersistenceBackend } from "./chat-persistence-config.js";
import { loadSavedProviderConfig, saveProviderConfig } from "./provider-config.js";

interface ProviderModelsRequest {
  provider?: string;
  baseURL?: string;
  apiKey?: string;
}

interface ProviderConfigRequest extends ProviderModelsRequest {
  model?: string;
}

interface ChatTurnRequest {
  sessionId?: string;
  message?: string;
}

interface ChatSessionRequest {
  sessionId?: string;
}

interface CreateChatSessionRequest {
  sessionId?: string;
  title?: string;
}

interface UpdateChatSessionRequest {
  sessionId?: string;
  title?: string;
}

interface UpdateChatPersistenceRequest {
  backend?: ChatPersistenceBackend;
}

interface ImportChatSessionRequest {
  exported?: unknown;
  title?: string;
}

interface SessionPackageReference {
  currentSchemaVersion: string;
  importMode: "new-session-only";
  importRule: string;
  topLevelFields: string[];
  requiredSnapshotCollections: string[];
  docs: {
    formatPath: string;
    samplePath: string;
  };
  sample: unknown;
}

type NextFunction = (error?: unknown) => void;

let cachedSessionPackageReference: SessionPackageReference | null = null;

export function createProviderApiMiddleware() {
  return async function providerApiMiddleware(
    request: IncomingMessage,
    response: ServerResponse,
    next: NextFunction
  ): Promise<void> {
    if (!request.url?.startsWith("/api/provider") && !request.url?.startsWith("/api/chat")) {
      next();
      return;
    }

    try {
      if (request.method === "POST" && request.url === "/api/chat/turn") {
        const payload = (await readJsonBody(request)) as ChatTurnRequest;
        const result = await sendChatTurn(
          requireNonEmpty(payload.sessionId, "Session ID is required."),
          requireNonEmpty(payload.message, "Message is required.")
        );

        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/session") {
        const payload = (await readJsonBody(request)) as ChatSessionRequest;
        const session = loadChatSessionSnapshot(
          payload.sessionId?.trim() || DEFAULT_CHAT_SESSION_ID
        );

        sendJson(response, 200, { session: session ?? null });
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/session/export") {
        const payload = (await readJsonBody(request)) as ChatSessionRequest;
        const exported = exportChatSession(
          payload.sessionId?.trim() || DEFAULT_CHAT_SESSION_ID
        );

        sendJson(response, 200, { exported });
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/session/import") {
        const payload = (await readJsonBody(request)) as ImportChatSessionRequest;
        const imported = importChatSession(
          payload.exported as Parameters<typeof importChatSession>[0],
          payload.title
        );

        sendJson(response, 200, {
          imported,
          sessions: listChatSessions(),
          defaultSessionId: DEFAULT_CHAT_SESSION_ID,
          persistence: getCurrentChatPersistenceStatus()
        });
        return;
      }

      if (request.method === "GET" && request.url === "/api/chat/session/format") {
        sendJson(response, 200, {
          reference: getSessionPackageReference()
        });
        return;
      }

      if (request.method === "GET" && request.url === "/api/chat/sessions") {
        sendJson(response, 200, {
          sessions: listChatSessions(),
          defaultSessionId: DEFAULT_CHAT_SESSION_ID,
          persistence: getCurrentChatPersistenceStatus()
        });
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/sessions") {
        const payload = (await readJsonBody(request)) as CreateChatSessionRequest;
        const session = createChatSession(payload.sessionId, payload.title);

        sendJson(response, 200, {
          session,
          sessions: listChatSessions(),
          defaultSessionId: DEFAULT_CHAT_SESSION_ID,
          persistence: getCurrentChatPersistenceStatus()
        });
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/sessions/rename") {
        const payload = (await readJsonBody(request)) as UpdateChatSessionRequest;
        const session = renameChatSession(
          requireNonEmpty(payload.sessionId, "Session ID is required."),
          requireNonEmpty(payload.title, "Session title is required.")
        );

        sendJson(response, 200, {
          session,
          sessions: listChatSessions(),
          defaultSessionId: DEFAULT_CHAT_SESSION_ID,
          persistence: getCurrentChatPersistenceStatus()
        });
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/sessions/delete") {
        const payload = (await readJsonBody(request)) as ChatSessionRequest;
        const sessions = deleteChatSession(
          requireNonEmpty(payload.sessionId, "Session ID is required.")
        );

        sendJson(response, 200, {
          sessions,
          defaultSessionId: DEFAULT_CHAT_SESSION_ID,
          persistence: getCurrentChatPersistenceStatus()
        });
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/sessions/reset") {
        const payload = (await readJsonBody(request)) as ChatSessionRequest;
        const sessionId = requireNonEmpty(payload.sessionId, "Session ID is required.");
        const session = resetChatSession(sessionId);
        resetChatRuntimeSessions();

        sendJson(response, 200, {
          session,
          sessions: listChatSessions(),
          defaultSessionId: DEFAULT_CHAT_SESSION_ID,
          persistence: getCurrentChatPersistenceStatus()
        });
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/persistence") {
        const payload = (await readJsonBody(request)) as UpdateChatPersistenceRequest;
        const result = switchChatPersistenceBackend(
          requirePersistenceBackend(payload.backend)
        );
        resetChatRuntimeSessions();

        sendJson(response, 200, {
          sessions: listChatSessions(),
          defaultSessionId: DEFAULT_CHAT_SESSION_ID,
          persistence: result.persistence,
          importedSessionCount: result.importedSessionCount
        });
        return;
      }

      if (request.method === "GET" && request.url === "/api/provider/presets") {
        sendJson(response, 200, { presets: PROVIDER_PRESETS });
        return;
      }

      if (request.method === "GET" && request.url === "/api/provider/config") {
        sendJson(response, 200, { config: loadSavedProviderConfig() });
        return;
      }

      if (request.method === "POST" && request.url === "/api/provider/models") {
        const payload = (await readJsonBody(request)) as ProviderModelsRequest;
        const provider = requireNonEmpty(payload.provider, "Provider is required.");
        const baseURL = requireNonEmpty(payload.baseURL, "Base URL is required.");
        const apiKey = requireNonEmpty(payload.apiKey, "API key is required.");

        const adapter = new OpenAICompatibleChatProvider({
          provider,
          baseURL,
          apiKey,
          model: "placeholder-model"
        });

        const models = await adapter.listModels();
        sendJson(response, 200, { models });
        return;
      }

      if (request.method === "POST" && request.url === "/api/provider/config") {
        const payload = (await readJsonBody(request)) as ProviderConfigRequest;
        const config = saveProviderConfig({
          provider: requireNonEmpty(payload.provider, "Provider is required."),
          baseURL: requireNonEmpty(payload.baseURL, "Base URL is required."),
          apiKey: requireNonEmpty(payload.apiKey, "API key is required."),
          model: requireNonEmpty(payload.model, "Model is required.")
        });

        sendJson(response, 200, { config });
        return;
      }

      sendJson(response, 404, { error: "Provider API route not found." });
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : "Unexpected provider API error.",
        ...(error instanceof ChatSessionImportValidationError ? { details: error.details } : {})
      });
    }
  };
}

function sendJson(response: ServerResponse, statusCode: number, payload: object): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  return rawBody ? (JSON.parse(rawBody) as unknown) : {};
}

function requireNonEmpty(value: string | undefined, message: string): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(message);
  }

  return normalized;
}

function requirePersistenceBackend(
  value: ChatPersistenceBackend | undefined
): ChatPersistenceBackend {
  if (value === "file" || value === "sqlite") {
    return value;
  }

  throw new Error("A valid chat persistence backend is required.");
}

function getSessionPackageReference(): SessionPackageReference {
  if (cachedSessionPackageReference) {
    return cachedSessionPackageReference;
  }

  cachedSessionPackageReference = {
    currentSchemaVersion: CHAT_SESSION_SCHEMA_VERSION,
    importMode: "new-session-only",
    importRule:
      "Waveary validates the package, creates a brand-new local session ID, and never overwrites or merges an existing session during import.",
    topLevelFields: ["schemaVersion", "exportedAt", "sessionId", "title", "snapshot"],
    requiredSnapshotCollections: ["messages", "memoryArchive", "timelineEvents"],
    docs: {
      formatPath: "docs/session-file-format.md",
      samplePath: "docs/examples/session-export.sample.json"
    },
    sample: readSessionPackageSample()
  };

  return cachedSessionPackageReference;
}

function readSessionPackageSample(): unknown {
  const samplePath = resolveSessionPackageSamplePath();
  return JSON.parse(readFileSync(samplePath, "utf8")) as unknown;
}

function resolveSessionPackageSamplePath(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    resolve(currentDir, "..", "..", "docs", "examples", "session-export.sample.json"),
    resolve(currentDir, "..", "..", "..", "docs", "examples", "session-export.sample.json")
  ];
  const matchedPath = candidatePaths.find((candidatePath) => existsSync(candidatePath));

  if (!matchedPath) {
    throw new Error("Waveary session export sample file could not be located.");
  }

  return matchedPath;
}
