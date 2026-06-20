import type { IncomingMessage, ServerResponse } from "node:http";

import { OpenAICompatibleChatProvider, PROVIDER_PRESETS } from "@waveary/core";

import { loadChatSessionSnapshot, sendChatTurn } from "./chat-runtime.js";
import {
  createChatSession,
  DEFAULT_CHAT_SESSION_ID,
  listChatSessions
} from "./chat-session-store.js";
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

type NextFunction = (error?: unknown) => void;

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

      if (request.method === "GET" && request.url === "/api/chat/sessions") {
        sendJson(response, 200, {
          sessions: listChatSessions(),
          defaultSessionId: DEFAULT_CHAT_SESSION_ID
        });
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/sessions") {
        const payload = (await readJsonBody(request)) as CreateChatSessionRequest;
        const session = createChatSession(payload.sessionId, payload.title);

        sendJson(response, 200, {
          session,
          sessions: listChatSessions(),
          defaultSessionId: DEFAULT_CHAT_SESSION_ID
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
        error: error instanceof Error ? error.message : "Unexpected provider API error."
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
