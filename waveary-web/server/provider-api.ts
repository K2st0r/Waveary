import type { IncomingMessage, ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { OpenAICompatibleChatProvider, PROVIDER_PRESETS } from "@waveary/core";
import type { EmotionState, RelationshipProfile } from "@waveary/core";
import {
  clickManagedBrowserElementByText,
  extractManagedBrowserPageText,
  getManagedBrowserPageInfo,
  listManagedBrowserClickableElements,
  searchManagedBrowserPageText
} from "./browser-automation.js";

import {
  dismissChatLocalAction,
  executeChatLocalAction
} from "./local-action-runtime.js";
import {
  evaluateChatProactiveCare,
  loadChatSessionSnapshot,
  resetChatRuntimeSessions,
  sendChatTurn
} from "./chat-runtime.js";
import { planChatSpeech } from "./voice-runtime.js";
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
  switchChatPersistenceBackend,
  updateChatSessionProactiveCare
} from "./chat-session-store.js";
import type { ChatPersistenceBackend } from "./chat-persistence-config.js";
import type { LocalActionPermissionLevel } from "./local-actions.js";
import { loadSavedProviderConfig, saveProviderConfig } from "./provider-config.js";
import {
  buildStaticVoiceCatalog,
  listVoiceProviderPresets,
  listVoicePresets,
  loadSavedVoiceConfig,
  resolveVoiceProviderPreset,
  saveVoiceConfig,
  type SavedVoiceConfig
} from "./voice-config.js";
import type { VoiceOutputFormat, VoiceQualityProfile } from "@waveary/voice";
import type { CompanionDeliveryHint } from "./companion-delivery.js";
import { buildVoiceRoutingDiagnostic } from "./voice-routing-diagnostics.js";

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
  localActionPermission?: LocalActionPermissionLevel;
  locale?: string;
  timeContext?: {
    localTimeIso?: string;
    timeZone?: string;
    locale?: string;
  };
}

interface VoiceSpeakRequest {
  text?: string;
  locale?: string;
  relationship?: RelationshipProfile | null;
  emotion?: EmotionState;
  delivery?: CompanionDeliveryHint;
  persona?: {
    tone?: string;
    voiceStyle?: string;
  };
  voiceConfig?: Partial<SavedVoiceConfig>;
}

interface VoiceConfigRequest {
  model?: string;
  voice?: string;
  format?: VoiceOutputFormat;
  qualityProfile?: VoiceQualityProfile;
  providerMode?: "shared" | "dedicated";
  provider?: string;
  baseURL?: string;
  apiKey?: string;
  appId?: string;
  cluster?: string;
  endpointPath?: string;
  engine?: string;
  speaker?: string;
  referenceVoiceId?: string;
  textLanguage?: string;
  promptLanguage?: string;
  referenceTranscript?: string;
  stylePrompt?: string;
  styleStrength?: number | null;
  temperature?: number | null;
  topP?: number | null;
}

interface VoiceCatalogRequest {
  provider?: string;
  baseURL?: string;
  apiKey?: string;
}

interface ChatSessionRequest {
  sessionId?: string;
}

interface BrowserExtractRequest {
  maxChars?: number;
}

interface BrowserSearchRequest {
  query?: string;
  maxSnippets?: number;
  snippetRadius?: number;
}

interface BrowserClickableElementsRequest {
  maxElements?: number;
}

interface BrowserClickTextRequest {
  text?: string;
  exact?: boolean;
  timeoutMs?: number;
}

interface ExecuteLocalActionRequest extends ChatSessionRequest {
  actionId?: string;
  permission?: LocalActionPermissionLevel;
  approved?: boolean;
  locale?: string;
}

interface EvaluateProactiveCareRequest extends ChatSessionRequest {
  now?: string;
  timeContext?: {
    localTimeIso?: string;
    timeZone?: string;
    locale?: string;
  };
  policy?: {
    enabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    maxDailyReachouts?: number;
    allowMealCare?: boolean;
    allowSleepCare?: boolean;
    allowAbsenceCheckins?: boolean;
  };
  state?: {
    dailyReachoutsSent?: number;
    unansweredReachoutCount?: number;
    lastReachOutAt?: string;
  };
}

interface UpdateProactiveCareSettingsRequest extends ChatSessionRequest {
  policy?: {
    enabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    maxDailyReachouts?: number;
    allowMealCare?: boolean;
    allowSleepCare?: boolean;
    allowAbsenceCheckins?: boolean;
  };
  state?: {
    dailyReachoutsSent?: number;
    unansweredReachoutCount?: number;
    lastReachOutAt?: string;
  };
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
    if (
      !request.url?.startsWith("/api/provider") &&
      !request.url?.startsWith("/api/chat") &&
      !request.url?.startsWith("/api/browser") &&
      !request.url?.startsWith("/api/voice")
    ) {
      next();
      return;
    }

    try {
      if (request.method === "POST" && request.url === "/api/chat/turn") {
        const payload = (await readJsonBody(request)) as ChatTurnRequest;
        const result = await sendChatTurn(
          requireNonEmpty(payload.sessionId, "Session ID is required."),
          requireNonEmpty(payload.message, "Message is required."),
          {
            ...(payload.localActionPermission
              ? {
                  localActionPermission: requireLocalActionPermission(
                    payload.localActionPermission
                  )
                }
              : {}),
            ...(payload.locale ? { locale: normalizeLocalActionLocale(payload.locale) } : {}),
            ...(payload.timeContext?.localTimeIso
              ? {
                  localTime: {
                    iso: requireNonEmpty(
                      payload.timeContext.localTimeIso,
                      "Local time ISO is required when time context is provided."
                    ),
                    ...(payload.timeContext.timeZone?.trim()
                      ? { timeZone: payload.timeContext.timeZone.trim() }
                      : {}),
                    ...(payload.timeContext.locale?.trim()
                      ? { locale: payload.timeContext.locale.trim() }
                      : {})
                  }
                }
              : {})
          }
        );

        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && request.url === "/api/voice/speak") {
        const payload = (await readJsonBody(request)) as VoiceSpeakRequest;
        const result = await planChatSpeech({
          text: requireNonEmpty(payload.text, "Voice text is required."),
          ...(payload.locale?.trim() ? { locale: payload.locale.trim() } : {}),
          ...(payload.relationship !== undefined ? { relationship: payload.relationship } : {}),
          ...(payload.emotion !== undefined ? { emotion: payload.emotion } : {}),
          ...(payload.delivery !== undefined ? { delivery: payload.delivery } : {}),
          ...(payload.persona !== undefined ? { persona: payload.persona } : {}),
          ...(payload.voiceConfig !== undefined ? { voiceConfig: payload.voiceConfig } : {})
        });

        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && request.url === "/api/voice/config") {
        const config = loadSavedVoiceConfig();
        sendJson(response, 200, {
          config,
          presets: listVoicePresets(),
          routing: buildVoiceRoutingDiagnostic(config, loadSavedProviderConfig())
        });
        return;
      }

      if (request.method === "GET" && request.url === "/api/voice/presets") {
        sendJson(response, 200, {
          presets: listVoiceProviderPresets()
        });
        return;
      }

      if (request.method === "POST" && request.url === "/api/voice/config") {
        const payload = (await readJsonBody(request)) as VoiceConfigRequest;
        const config = saveVoiceConfig(payload);

        sendJson(response, 200, {
          config,
          presets: listVoicePresets(),
          routing: buildVoiceRoutingDiagnostic(config, loadSavedProviderConfig())
        });
        return;
      }

      if (request.method === "POST" && request.url === "/api/voice/catalog") {
        const payload = (await readJsonBody(request)) as VoiceCatalogRequest;
        const providerInput = requireNonEmpty(payload.provider, "Voice provider is required.");
        const preset = resolveVoiceProviderPreset(providerInput);
        const provider = preset?.provider ?? providerInput;
        const staticCatalog = buildStaticVoiceCatalog(provider);

        if (!staticCatalog) {
          throw new Error("Voice provider catalog is not available.");
        }

        if (staticCatalog.providerType === "openai-compatible") {
          const baseURL = requireNonEmpty(
            payload.baseURL ?? preset?.baseURL,
            "Voice base URL is required."
          );
          const apiKey = requireNonEmpty(payload.apiKey, "Voice API key is required.");
          const adapter = new OpenAICompatibleChatProvider({
            provider,
            baseURL,
            apiKey,
            model: "placeholder-model"
          });
          const models = await adapter.listModels();

          sendJson(response, 200, {
            ...staticCatalog,
            models
          });
          return;
        }

        sendJson(response, 200, staticCatalog);
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

      if (request.method === "GET" && request.url === "/api/browser/page") {
        const page = await getManagedBrowserPageInfo();
        sendJson(response, 200, { page });
        return;
      }

      if (request.method === "POST" && request.url === "/api/browser/extract-text") {
        const payload = (await readJsonBody(request)) as BrowserExtractRequest;
        const result = await extractManagedBrowserPageText({
          ...(typeof payload.maxChars === "number" ? { maxChars: payload.maxChars } : {})
        });

        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && request.url === "/api/browser/search-text") {
        const payload = (await readJsonBody(request)) as BrowserSearchRequest;
        const result = await searchManagedBrowserPageText(
          requireNonEmpty(payload.query, "Browser search query is required."),
          {
            ...(typeof payload.maxSnippets === "number"
              ? { maxSnippets: payload.maxSnippets }
              : {}),
            ...(typeof payload.snippetRadius === "number"
              ? { snippetRadius: payload.snippetRadius }
              : {})
          }
        );

        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && request.url === "/api/browser/clickable-elements") {
        const payload = (await readJsonBody(request)) as BrowserClickableElementsRequest;
        const result = await listManagedBrowserClickableElements({
          ...(typeof payload.maxElements === "number"
            ? { maxElements: payload.maxElements }
            : {})
        });

        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && request.url === "/api/browser/click-text") {
        const payload = (await readJsonBody(request)) as BrowserClickTextRequest;
        const result = await clickManagedBrowserElementByText(
          requireNonEmpty(payload.text, "Browser click target text is required."),
          {
            ...(typeof payload.exact === "boolean" ? { exact: payload.exact } : {}),
            ...(typeof payload.timeoutMs === "number"
              ? { timeoutMs: payload.timeoutMs }
              : {})
          }
        );

        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/local-action/execute") {
        const payload = (await readJsonBody(request)) as ExecuteLocalActionRequest;
        const result = await executeChatLocalAction({
          sessionId: payload.sessionId?.trim() || DEFAULT_CHAT_SESSION_ID,
          actionId: requireNonEmpty(payload.actionId, "Action ID is required."),
          permission: requireLocalActionPermission(payload.permission),
          locale: normalizeLocalActionLocale(payload.locale),
          ...(payload.approved !== undefined ? { approved: payload.approved } : {})
        });

        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/local-action/dismiss") {
        const payload = (await readJsonBody(request)) as ExecuteLocalActionRequest;
        const result = dismissChatLocalAction({
          sessionId: payload.sessionId?.trim() || DEFAULT_CHAT_SESSION_ID,
          actionId: requireNonEmpty(payload.actionId, "Action ID is required."),
          locale: normalizeLocalActionLocale(payload.locale)
        });

        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/proactive/evaluate") {
        const payload = (await readJsonBody(request)) as EvaluateProactiveCareRequest;
        const result = await evaluateChatProactiveCare(
          payload.sessionId?.trim() || DEFAULT_CHAT_SESSION_ID,
          {
            ...(payload.now ? { now: payload.now } : {}),
            ...(payload.timeContext ? { timeContext: payload.timeContext } : {}),
            ...(payload.policy ? { policy: payload.policy } : {}),
            ...(payload.state ? { state: payload.state } : {})
          }
        );

        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && request.url === "/api/chat/proactive/settings") {
        const payload = (await readJsonBody(request)) as UpdateProactiveCareSettingsRequest;
        const result = updateChatSessionProactiveCare(
          payload.sessionId?.trim() || DEFAULT_CHAT_SESSION_ID,
          {
            ...(payload.policy ? { policy: payload.policy } : {}),
            ...(payload.state ? { state: payload.state } : {})
          }
        );

        sendJson(response, 200, result);
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

function requireLocalActionPermission(
  value: LocalActionPermissionLevel | undefined
): LocalActionPermissionLevel {
  if (value === "allow" || value === "ask" || value === "deny") {
    return value;
  }

  throw new Error("A valid local action permission is required.");
}

function normalizeLocalActionLocale(value: string | undefined): "zh" | "en" {
  return value?.toLowerCase().startsWith("zh") ? "zh" : "en";
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
