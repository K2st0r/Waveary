import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

interface ProviderPreset {
  id: string;
  label: string;
  baseURL: string;
}

interface SavedProviderConfig {
  provider: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

interface ModelDescriptor {
  id: string;
  provider: string;
  label?: string;
}

interface ChatTurnResponse {
  reply: string;
  relationship: {
    stage: string;
    affinityScore: number;
    trustScore: number;
    stabilityScore: number;
  };
  emotion?: {
    primaryEmotion: string;
    intensity: number;
  };
  recalledMemories: string[];
  storedMemories: string[];
  timeline: Array<{
    title: string;
    type: string;
    eventTime: string;
  }>;
}

interface SessionMemoryArchiveItem {
  id: string;
  type: string;
  content: string;
  importance: number;
  createdAt: string;
}

interface SessionRelationshipSnapshot {
  stage: string;
  affinityScore: number;
  trustScore: number;
  stabilityScore: number;
  lastUpdatedAt: string;
}

interface SessionTimelineEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  eventTime: string;
  importance: number;
}

interface ChatSessionSnapshot {
  sessionId: string;
  messages: ChatMessage[];
  latestInsights: ChatTurnResponse | null;
  memoryArchive: SessionMemoryArchiveItem[];
  relationship: SessionRelationshipSnapshot | null;
  timelineEvents: SessionTimelineEvent[];
  updatedAt: string;
}

interface ExportedChatSession {
  exportedAt: string;
  sessionId: string;
  title: string;
  snapshot: ChatSessionSnapshot;
}

interface ImportedChatSessionResult {
  session: ChatSessionSnapshot;
  exportedAt: string;
  importedFromSessionId: string;
  importedTitle: string;
}

interface ChatSessionListItem {
  sessionId: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

type ChatPersistenceBackend = "file" | "sqlite";

type ChatPersistenceSyncState = "active" | "in-sync" | "behind" | "ahead" | "diverged";

interface ChatPersistenceSyncMetadata {
  fromBackend: ChatPersistenceBackend | null;
  toBackend: ChatPersistenceBackend | null;
  switchedAt: string | null;
  synchronizedSessionCount: number;
}

interface ChatPersistenceBackendStatus {
  backend: ChatPersistenceBackend;
  storageLabel: string;
  exists: boolean;
  sessionCount: number;
  latestUpdatedAt: string | null;
  syncState: ChatPersistenceSyncState;
  differingSessionCount: number;
}

interface ChatPersistenceStatus {
  backend: ChatPersistenceBackend;
  availableBackends: ChatPersistenceBackend[];
  storageLabel: string;
  lastSync: ChatPersistenceSyncMetadata;
  backendDetails: ChatPersistenceBackendStatus[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const engineCards = [
  {
    acronym: "WME",
    name: "Waveary Memory Engine",
    summary: "Turn conversation into durable memory, not disposable context."
  },
  {
    acronym: "WRE",
    name: "Waveary Relationship Engine",
    summary: "Model relationship growth as state, signals, and long-term trust."
  },
  {
    acronym: "WTE",
    name: "Waveary Timeline Engine",
    summary: "Organize life events into recallable personal history."
  },
  {
    acronym: "WEE",
    name: "Waveary Emotion Engine",
    summary: "Track emotional state to guide tone, care, and continuity."
  },
  {
    acronym: "WVE",
    name: "Waveary Voice Engine",
    summary: "Prepare the path from text companionship to real-time voice."
  }
] as const;

const roadmap = [
  {
    version: "V0.1",
    timeframe: "30 Days",
    goal: "Establish the first usable open source digital companion framework.",
    items: ["Chat", "Long-term memory", "Timeline", "Relationship growth"]
  },
  {
    version: "V0.2",
    timeframe: "60 Days",
    goal: "Expand the framework from continuity into emotional presence.",
    items: ["Voice", "Emotion analysis", "Proactive care"]
  },
  {
    version: "V0.3",
    timeframe: "90 Days",
    goal: "Move from asynchronous interaction to live companionship.",
    items: ["Real-time voice", "Interruptions", "Full duplex conversation"]
  }
] as const;

const principles = [
  "Memory comes before model.",
  "Relationship comes before features.",
  "Companionship comes before intelligence."
] as const;

const setupSteps = [
  "Choose provider",
  "Enter API key",
  "Fetch models",
  "Select model",
  "Save config",
  "Open chat next"
] as const;

type LoadState = "idle" | "loading" | "success" | "error";

export function App(): ReactElement {
  const [presets, setPresets] = useState<ProviderPreset[]>([]);
  const [savedConfig, setSavedConfig] = useState<SavedProviderConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [baseURL, setBaseURL] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<ModelDescriptor[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [modelsState, setModelsState] = useState<LoadState>("idle");
  const [saveState, setSaveState] = useState<LoadState>("idle");
  const [statusMessage, setStatusMessage] = useState("Loading provider configuration...");

  const [chatInput, setChatInput] = useState("");
  const [chatState, setChatState] = useState<LoadState>("idle");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInsights, setChatInsights] = useState<ChatTurnResponse | null>(null);
  const [chatRestoredAt, setChatRestoredAt] = useState<string | null>(null);
  const [sessionMemoryArchive, setSessionMemoryArchive] = useState<SessionMemoryArchiveItem[]>([]);
  const [sessionRelationship, setSessionRelationship] = useState<SessionRelationshipSnapshot | null>(null);
  const [sessionTimelineEvents, setSessionTimelineEvents] = useState<SessionTimelineEvent[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSessionListItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [defaultSessionId, setDefaultSessionId] = useState("");
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [sessionRenameTitle, setSessionRenameTitle] = useState("");
  const [persistenceStatus, setPersistenceStatus] = useState<ChatPersistenceStatus | null>(null);
  const [selectedPersistenceBackend, setSelectedPersistenceBackend] = useState<ChatPersistenceBackend>("file");
  const [persistenceState, setPersistenceState] = useState<LoadState>("idle");
  const [sessionExportState, setSessionExportState] = useState<LoadState>("idle");
  const [sessionExportJson, setSessionExportJson] = useState("");
  const [sessionImportState, setSessionImportState] = useState<LoadState>("idle");
  const [sessionImportJson, setSessionImportJson] = useState("");
  const [sessionImportTitle, setSessionImportTitle] = useState("");
  const sessionImportFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void loadInitialState();
  }, []);

  async function loadInitialState(): Promise<void> {
    setLoadState("loading");

    try {
      const [presetResponse, configResponse, sessionsResponse] = await Promise.all([
        fetchJson<{ presets: ProviderPreset[] }>("/api/provider/presets"),
        fetchJson<{ config?: SavedProviderConfig }>("/api/provider/config"),
        fetchJson<{
          sessions: ChatSessionListItem[];
          defaultSessionId: string;
          persistence: ChatPersistenceStatus;
        }>("/api/chat/sessions")
      ]);

      const nextPresets = presetResponse.presets;
      const nextConfig = configResponse.config ?? null;
      const fallbackPreset = nextPresets[0];
      const nextSessions = sessionsResponse.sessions;
      const nextDefaultSessionId = sessionsResponse.defaultSessionId;
      const nextActiveSessionId = nextSessions[0]?.sessionId ?? nextDefaultSessionId;

      setPresets(nextPresets);
      setSavedConfig(nextConfig);
      setChatSessions(nextSessions);
      setDefaultSessionId(nextDefaultSessionId);
      setActiveSessionId(nextActiveSessionId);
      setSessionRenameTitle(nextSessions.find((session) => session.sessionId === nextActiveSessionId)?.title ?? "");
      setPersistenceStatus(sessionsResponse.persistence);
      setSelectedPersistenceBackend(sessionsResponse.persistence.backend);
      await loadChatSession(nextActiveSessionId);

      if (nextConfig) {
        setSelectedProvider(nextConfig.provider);
        setBaseURL(nextConfig.baseURL);
        setApiKey(nextConfig.apiKey);
        setSelectedModel(nextConfig.model);
        setModels([{ id: nextConfig.model, provider: nextConfig.provider }]);
        setStatusMessage("Loaded saved provider configuration from .waveary/provider-config.json.");
      } else if (fallbackPreset) {
        setSelectedProvider(fallbackPreset.id);
        setBaseURL(fallbackPreset.baseURL);
        setStatusMessage("Choose a provider and fetch the models available to your API key. Existing local sessions remain available.");
      } else {
        setStatusMessage("No provider presets are available.");
      }

      setLoadState("success");
    } catch (error) {
      setLoadState("error");
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function loadChatSession(sessionId: string): Promise<void> {
    try {
      const response = await fetchJson<{ session: ChatSessionSnapshot | null }>("/api/chat/session", {
        method: "POST",
        body: JSON.stringify({
          sessionId
        })
      });

      if (!response.session) {
        setChatMessages([]);
        setChatInsights(null);
        setChatRestoredAt(null);
        setSessionMemoryArchive([]);
        setSessionRelationship(null);
        setSessionTimelineEvents([]);
        return;
      }

      setChatMessages(response.session.messages);
      setChatInsights(response.session.latestInsights);
      setChatRestoredAt(response.session.updatedAt);
      setSessionMemoryArchive(response.session.memoryArchive);
      setSessionRelationship(response.session.relationship);
      setSessionTimelineEvents(response.session.timelineEvents);
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  }

  function handleProviderChange(event: ChangeEvent<HTMLSelectElement>): void {
    const nextProvider = event.target.value;
    const preset = presets.find((entry) => entry.id === nextProvider);

    setSelectedProvider(nextProvider);
    setBaseURL(preset?.baseURL ?? "");
    setModels([]);
    setSelectedModel("");
    setModelsState("idle");
    setSaveState("idle");
  }

  async function handleFetchModels(): Promise<void> {
    setModelsState("loading");
    setSaveState("idle");

    try {
      const response = await fetchJson<{ models: ModelDescriptor[] }>("/api/provider/models", {
        method: "POST",
        body: JSON.stringify({
          provider: selectedProvider,
          baseURL,
          apiKey
        })
      });

      setModels(response.models);
      setSelectedModel((current) => current || response.models[0]?.id || "");
      setModelsState("success");
      setStatusMessage(
        response.models.length > 0
          ? `Fetched ${response.models.length} models for ${selectedProvider}.`
          : "No models were returned for this API key."
      );
    } catch (error) {
      setModels([]);
      setSelectedModel("");
      setModelsState("error");
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleSaveConfig(): Promise<void> {
    setSaveState("loading");

    try {
      const response = await fetchJson<{ config: SavedProviderConfig }>("/api/provider/config", {
        method: "POST",
        body: JSON.stringify({
          provider: selectedProvider,
          baseURL,
          apiKey,
          model: selectedModel
        })
      });

      setSavedConfig(response.config);
      setSaveState("success");
      setStatusMessage("Provider configuration saved locally. Waveary is ready to use this model.");
      await loadChatSession(activeSessionId || defaultSessionId);
    } catch (error) {
      setSaveState("error");
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleSessionChange(nextSessionId: string): Promise<void> {
    setActiveSessionId(nextSessionId);
    setSessionRenameTitle(chatSessions.find((session) => session.sessionId === nextSessionId)?.title ?? "");
    await loadChatSession(nextSessionId);
  }

  async function handleCreateSession(): Promise<void> {
    try {
      const response = await fetchJson<{
        session: ChatSessionSnapshot;
        sessions: ChatSessionListItem[];
        defaultSessionId: string;
        persistence: ChatPersistenceStatus;
      }>("/api/chat/sessions", {
        method: "POST",
        body: JSON.stringify({
          title: newSessionTitle.trim() || undefined
        })
      });

      setChatSessions(response.sessions);
      setDefaultSessionId(response.defaultSessionId);
      setPersistenceStatus(response.persistence);
      setSelectedPersistenceBackend(response.persistence.backend);
      setActiveSessionId(response.session.sessionId);
      setSessionRenameTitle(
        response.sessions.find((session) => session.sessionId === response.session.sessionId)?.title ?? ""
      );
      setChatMessages(response.session.messages);
      setChatInsights(response.session.latestInsights);
      setChatRestoredAt(response.session.updatedAt);
      setSessionMemoryArchive(response.session.memoryArchive);
      setSessionRelationship(response.session.relationship);
      setSessionTimelineEvents(response.session.timelineEvents);
      setNewSessionTitle("");
      setStatusMessage("Created a new local chat session.");
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleRenameSession(): Promise<void> {
    if (!activeSessionId || activeSessionId === defaultSessionId) {
      return;
    }

    try {
      const response = await fetchJson<{
        session: ChatSessionSnapshot;
        sessions: ChatSessionListItem[];
        defaultSessionId: string;
        persistence: ChatPersistenceStatus;
      }>("/api/chat/sessions/rename", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSessionId,
          title: sessionRenameTitle
        })
      });

      setChatSessions(response.sessions);
      setDefaultSessionId(response.defaultSessionId);
      setPersistenceStatus(response.persistence);
      setSelectedPersistenceBackend(response.persistence.backend);
      setSessionRenameTitle(
        response.sessions.find((session) => session.sessionId === activeSessionId)?.title ?? sessionRenameTitle
      );
      setStatusMessage("Session title updated.");
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleDeleteSession(): Promise<void> {
    if (!activeSessionId || activeSessionId === defaultSessionId) {
      return;
    }

    try {
      const response = await fetchJson<{
        sessions: ChatSessionListItem[];
        defaultSessionId: string;
        persistence: ChatPersistenceStatus;
      }>("/api/chat/sessions/delete", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSessionId
        })
      });

      const fallbackSessionId = response.defaultSessionId;

      setChatSessions(response.sessions);
      setDefaultSessionId(response.defaultSessionId);
      setPersistenceStatus(response.persistence);
      setSelectedPersistenceBackend(response.persistence.backend);
      setActiveSessionId(fallbackSessionId);
      setSessionRenameTitle(
        response.sessions.find((session) => session.sessionId === fallbackSessionId)?.title ?? ""
      );
      await loadChatSession(fallbackSessionId);
      setStatusMessage("Session deleted.");
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleResetSession(): Promise<void> {
    if (!activeSessionId) {
      return;
    }

    try {
      const response = await fetchJson<{
        session: ChatSessionSnapshot;
        sessions: ChatSessionListItem[];
        defaultSessionId: string;
        persistence: ChatPersistenceStatus;
      }>("/api/chat/sessions/reset", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSessionId
        })
      });

      setChatSessions(response.sessions);
      setDefaultSessionId(response.defaultSessionId);
      setPersistenceStatus(response.persistence);
      setSelectedPersistenceBackend(response.persistence.backend);
      setChatMessages(response.session.messages);
      setChatInsights(response.session.latestInsights);
      setChatRestoredAt(response.session.updatedAt);
      setSessionMemoryArchive(response.session.memoryArchive);
      setSessionRelationship(response.session.relationship);
      setSessionTimelineEvents(response.session.timelineEvents);
      setSessionRenameTitle(
        response.sessions.find((session) => session.sessionId === activeSessionId)?.title ?? ""
      );
      setStatusMessage(
        activeSessionId === defaultSessionId
          ? "Main companion session reset. Local history and latest signals were cleared."
          : "Session reset. Local history and latest signals were cleared."
      );
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handlePersistenceSwitch(): Promise<void> {
    setPersistenceState("loading");

    try {
      const response = await fetchJson<{
        sessions: ChatSessionListItem[];
        defaultSessionId: string;
        persistence: ChatPersistenceStatus;
        importedSessionCount: number;
      }>("/api/chat/persistence", {
        method: "POST",
        body: JSON.stringify({
          backend: selectedPersistenceBackend
        })
      });

      const nextActiveSessionId =
        response.sessions.find((session) => session.sessionId === activeSessionId)?.sessionId ??
        response.sessions[0]?.sessionId ??
        response.defaultSessionId;

      setChatSessions(response.sessions);
      setDefaultSessionId(response.defaultSessionId);
      setPersistenceStatus(response.persistence);
      setSelectedPersistenceBackend(response.persistence.backend);
      setActiveSessionId(nextActiveSessionId);
      setSessionRenameTitle(
        response.sessions.find((session) => session.sessionId === nextActiveSessionId)?.title ?? ""
      );
      await loadChatSession(nextActiveSessionId);
      setPersistenceState("success");
      setStatusMessage(
        response.importedSessionCount > 0
          ? `Switched chat persistence to ${response.persistence.backend}. Imported ${response.importedSessionCount} existing sessions.`
          : `Switched chat persistence to ${response.persistence.backend}.`
      );
    } catch (error) {
      setPersistenceState("error");
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleExportSession(): Promise<void> {
    if (!activeSessionId) {
      return;
    }

    setSessionExportState("loading");

    try {
      const response = await fetchJson<{ exported: ExportedChatSession }>("/api/chat/session/export", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSessionId
        })
      });

      setSessionExportJson(JSON.stringify(response.exported, null, 2));
      downloadSessionExport(response.exported);
      setSessionExportState("success");
      setStatusMessage(`Exported session package for ${response.exported.title}.`);
    } catch (error) {
      setSessionExportState("error");
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleImportSessionFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setSessionImportJson(text);
      setStatusMessage(`Loaded import file: ${file.name}`);
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    } finally {
      event.target.value = "";
    }
  }

  async function handleImportSession(): Promise<void> {
    if (!sessionImportJson.trim()) {
      return;
    }

    setSessionImportState("loading");

    try {
      const exported = JSON.parse(sessionImportJson) as ExportedChatSession;
      const response = await fetchJson<{
        imported: ImportedChatSessionResult;
        sessions: ChatSessionListItem[];
        defaultSessionId: string;
        persistence: ChatPersistenceStatus;
      }>("/api/chat/session/import", {
        method: "POST",
        body: JSON.stringify({
          exported,
          title: sessionImportTitle.trim() || undefined
        })
      });

      setChatSessions(response.sessions);
      setDefaultSessionId(response.defaultSessionId);
      setPersistenceStatus(response.persistence);
      setSelectedPersistenceBackend(response.persistence.backend);
      setActiveSessionId(response.imported.session.sessionId);
      setSessionRenameTitle(response.imported.importedTitle);
      setChatMessages(response.imported.session.messages);
      setChatInsights(response.imported.session.latestInsights);
      setChatRestoredAt(response.imported.session.updatedAt);
      setSessionMemoryArchive(response.imported.session.memoryArchive);
      setSessionRelationship(response.imported.session.relationship);
      setSessionTimelineEvents(response.imported.session.timelineEvents);
      setSessionImportState("success");
      setStatusMessage(`Imported session as ${response.imported.importedTitle}.`);
    } catch (error) {
      setSessionImportState("error");
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleSendMessage(): Promise<void> {
    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed
    };

    setChatInput("");
    setChatState("loading");
    setChatMessages((current) => [...current, userMessage]);

    try {
      const response = await fetchJson<ChatTurnResponse>("/api/chat/turn", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSessionId || defaultSessionId,
          message: trimmed
        })
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.reply
      };
      const [sessionsResponse, sessionSnapshotResponse] = await Promise.all([
        fetchJson<{
          sessions: ChatSessionListItem[];
          defaultSessionId: string;
          persistence: ChatPersistenceStatus;
        }>("/api/chat/sessions"),
        fetchJson<{ session: ChatSessionSnapshot | null }>("/api/chat/session", {
          method: "POST",
          body: JSON.stringify({
            sessionId: activeSessionId || defaultSessionId
          })
        })
      ]);

      setChatMessages((current) => [...current, assistantMessage]);
      setChatInsights(response);
      setChatRestoredAt(new Date().toISOString());
      setChatSessions(sessionsResponse.sessions);
      setDefaultSessionId(sessionsResponse.defaultSessionId);
      setPersistenceStatus(sessionsResponse.persistence);
      setSelectedPersistenceBackend(sessionsResponse.persistence.backend);
      setSessionMemoryArchive(sessionSnapshotResponse.session?.memoryArchive ?? []);
      setSessionRelationship(sessionSnapshotResponse.session?.relationship ?? null);
      setSessionTimelineEvents(sessionSnapshotResponse.session?.timelineEvents ?? []);
      setChatState("success");
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: getErrorMessage(error)
        }
      ]);
      setChatState("error");
    }
  }

  const isBusy =
    loadState === "loading" ||
    modelsState === "loading" ||
    saveState === "loading" ||
    persistenceState === "loading";
  const canFetchModels = Boolean(selectedProvider && baseURL.trim() && apiKey.trim()) && modelsState !== "loading";
  const canSaveConfig =
    Boolean(selectedProvider && baseURL.trim() && apiKey.trim() && selectedModel) && saveState !== "loading";
  const selectedPreset = presets.find((preset) => preset.id === selectedProvider) ?? null;
  const chatReady = Boolean(savedConfig?.provider && savedConfig.model);
  const activeSession =
    chatSessions.find((session) => session.sessionId === activeSessionId) ??
    chatSessions.find((session) => session.sessionId === defaultSessionId) ??
    null;
  const canCreateSession = newSessionTitle.trim().length > 0 || chatSessions.length > 0;
  const canRenameSession =
    Boolean(activeSessionId) &&
    activeSessionId !== defaultSessionId &&
    sessionRenameTitle.trim().length > 0 &&
    sessionRenameTitle.trim() !== activeSession?.title;
  const canSwitchPersistence =
    Boolean(persistenceStatus) &&
    selectedPersistenceBackend !== (persistenceStatus?.backend ?? selectedPersistenceBackend) &&
    persistenceState !== "loading";
  const canExportSession = Boolean(activeSessionId) && sessionExportState !== "loading";
  const canImportSession = Boolean(sessionImportJson.trim()) && sessionImportState !== "loading";
  const alternateBackendStatus =
    persistenceStatus?.backendDetails.find((detail) => detail.backend !== persistenceStatus.backend) ?? null;
  const hasSessionArchive =
    sessionMemoryArchive.length > 0 || sessionTimelineEvents.length > 0 || Boolean(sessionRelationship);

  return (
    <div className="page-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">Waveary</span>
          <span className="brand-subtitle">回响之境</span>
        </div>
        <nav className="topnav">
          <a href="#engines">Engines</a>
          <a href="#setup">Setup</a>
          <a href="#chat">Chat</a>
          <a href="#roadmap">Roadmap</a>
        </nav>
      </header>

      <main>
        <section className="hero section-grid">
          <div className="hero-copy">
            <div className="eyebrow">Digital Life Companion Framework</div>
            <h1>
              念念不忘，
              <br />
              终有回响。
            </h1>
            <p className="hero-lead">
              Waveary is an open source framework that gives any model long-term memory,
              relationship growth, life timeline awareness, and the capacity to stay with a user over time.
            </p>
            <p className="hero-support">
              It is not an AI girlfriend wrapper. It is a continuity layer for digital companionship.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#chat">
                Open Live Chat
              </a>
              <a className="button button-secondary" href="#setup">
                Provider Setup
              </a>
            </div>
            <ul className="principle-list">
              {principles.map((principle) => (
                <li key={principle}>{principle}</li>
              ))}
            </ul>
          </div>

          <div className="hero-panel">
            <div className="panel panel-hero">
              <div className="panel-header">
                <span>Continuity Console</span>
                <span className="status-dot">CE</span>
              </div>
              <div className="signal-grid">
                <div className="signal-card">
                  <strong>Memory</strong>
                  <span>Past details become reusable context.</span>
                </div>
                <div className="signal-card">
                  <strong>Relationship</strong>
                  <span>Trust and familiarity deepen over time.</span>
                </div>
                <div className="signal-card">
                  <strong>Timeline</strong>
                  <span>Moments become life events, not just logs.</span>
                </div>
                <div className="signal-card">
                  <strong>Emotion</strong>
                  <span>State guides tone, care, and continuity.</span>
                </div>
              </div>
              <div className="timeline-preview">
                <div className="timeline-row">
                  <span>06/20</span>
                  <p>Provider compatibility and browser setup are live.</p>
                </div>
                <div className="timeline-row">
                  <span>07/02</span>
                  <p>The first in-browser Waveary chat flow now rides on saved provider configuration.</p>
                </div>
                <div className="timeline-row">
                  <span>08/10</span>
                  <p>Next step: persist session state beyond this in-memory reference shell.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-grid section-block" id="engines">
          <div className="section-heading">
            <span className="eyebrow">Core Engines</span>
            <h2>A framework stack built for continuity, not short-term novelty.</h2>
          </div>
          <div className="engine-grid">
            {engineCards.map((engine) => (
              <article className="panel engine-card" key={engine.acronym}>
                <span className="engine-acronym">{engine.acronym}</span>
                <h3>{engine.name}</h3>
                <p>{engine.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-grid section-block feature-band" id="setup">
          <div className="section-heading">
            <span className="eyebrow">Provider Setup</span>
            <h2>Choose the vendor, discover the models behind your key, and save one usable runtime path.</h2>
            <p>
              This browser-native configuration flow keeps provider logic server-side while the web layer owns the interface.
            </p>
          </div>

          <div className="setup-layout">
            <div className="panel setup-overview-panel">
              <div className="panel-header">
                <span>Setup Sequence</span>
                <span className="panel-tag">Interactive</span>
              </div>
              <ol className="step-list">
                {setupSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>

              <div className="saved-config-block">
                <div className="mini-heading">Saved Configuration</div>
                {savedConfig ? (
                  <div className="saved-config-card">
                    <div>
                      <span className="saved-label">Provider</span>
                      <strong>{savedConfig.provider}</strong>
                    </div>
                    <div>
                      <span className="saved-label">Model</span>
                      <strong>{savedConfig.model}</strong>
                    </div>
                    <div>
                      <span className="saved-label">Base URL</span>
                      <code>{savedConfig.baseURL}</code>
                    </div>
                  </div>
                ) : (
                  <p className="provider-note">
                    No saved provider configuration yet. Complete the flow on the right to create one.
                  </p>
                )}
              </div>
            </div>

            <div className="panel provider-console-panel">
              <div className="panel-header">
                <span>Setup Console</span>
                <span className="panel-tag">Local API</span>
              </div>

              <div
                className={`status-banner ${
                  loadState === "error" || modelsState === "error" || saveState === "error"
                    ? "status-banner-error"
                    : "status-banner-info"
                }`}
              >
                {statusMessage}
              </div>

              <div className="provider-form-grid">
                <label className="form-field">
                  <span>Provider</span>
                  <select value={selectedProvider} onChange={handleProviderChange} disabled={isBusy}>
                    <option value="">Select a provider</option>
                    {presets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field form-field-wide">
                  <span>Base URL</span>
                  <input
                    type="text"
                    value={baseURL}
                    onChange={(event) => setBaseURL(event.target.value)}
                    placeholder="https://api.example.com/v1"
                    disabled={isBusy}
                  />
                </label>

                <label className="form-field form-field-wide">
                  <span>API Key</span>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="sk-..."
                    disabled={isBusy}
                  />
                </label>

                <div className="provider-hint">
                  <span className="mini-heading">Selected Preset</span>
                  <p>
                    {selectedPreset
                      ? `${selectedPreset.label} will use its OpenAI-compatible endpoint unless you override the base URL.`
                      : "Pick a provider preset to start from a known compatible endpoint."}
                  </p>
                </div>
              </div>

              <div className="console-actions">
                <button className="button button-primary" onClick={() => void handleFetchModels()} disabled={!canFetchModels}>
                  {modelsState === "loading" ? "Fetching Models..." : "Fetch Available Models"}
                </button>
              </div>

              <div className="models-section">
                <div className="mini-heading">Available Models</div>
                {models.length > 0 ? (
                  <label className="form-field">
                    <span>Model</span>
                    <select
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value)}
                      disabled={isBusy}
                    >
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.label ?? model.id}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className="provider-note">
                    Fetch models after entering a provider, base URL, and API key. The result list comes directly from
                    the provider&apos;s `/models` endpoint.
                  </p>
                )}
              </div>

              <div className="console-actions">
                <button className="button button-secondary" onClick={() => void handleSaveConfig()} disabled={!canSaveConfig}>
                  {saveState === "loading" ? "Saving..." : "Save Provider Configuration"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="section-grid section-block" id="chat">
          <div className="section-heading">
            <span className="eyebrow">Browser Chat</span>
            <h2>Use the saved provider configuration to run the first in-browser Waveary runtime flow.</h2>
            <p>
              This reference shell already returns a real reply plus memory recall, relationship change, and timeline output
              from the underlying runtime.
            </p>
          </div>

          <div className="panel session-panel">
            <div className="panel-header">
              <span>Session Layer</span>
              <span className="panel-tag">Main + Optional Sessions</span>
            </div>
            <div className="session-panel-grid">
              <div className="session-list">
                {chatSessions.map((session) => {
                  const isActive = session.sessionId === activeSessionId;
                  const isMain = session.sessionId === defaultSessionId;

                  return (
                    <button
                      className={`session-card ${isActive ? "session-card-active" : ""}`}
                      key={session.sessionId}
                      onClick={() => void handleSessionChange(session.sessionId)}
                      type="button"
                    >
                      <div className="session-card-topline">
                        <span className="session-card-title">{session.title}</span>
                        <span className={`session-badge ${isMain ? "session-badge-main" : "session-badge-side"}`}>
                          {isMain ? "Main" : "Session"}
                        </span>
                      </div>
                      <div className="session-card-meta">
                        <span>{session.messageCount} messages</span>
                        <span>{formatSessionTimestamp(session.updatedAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="session-controls">
                <div className="session-control-card">
                  <div className="mini-heading">Persistence Backend</div>
                  <div className="session-active-summary">
                    <strong>{persistenceStatus ? persistenceStatus.backend.toUpperCase() : "Loading..."}</strong>
                    <span>
                      {persistenceStatus
                        ? `Current local store: ${persistenceStatus.storageLabel}`
                        : "Loading current chat persistence backend."}
                    </span>
                  </div>
                  {persistenceStatus ? (
                    <div className="persistence-status-grid">
                      <div className="persistence-status-card">
                        <span className="mini-heading">Last Sync</span>
                        <strong>
                          {persistenceStatus.lastSync.switchedAt
                            ? `${formatPersistenceBackendLabel(
                                persistenceStatus.lastSync.fromBackend
                              )} -> ${formatPersistenceBackendLabel(persistenceStatus.lastSync.toBackend)}`
                            : "No switch recorded"}
                        </strong>
                        <span>
                          {persistenceStatus.lastSync.switchedAt
                            ? `${formatSessionTimestamp(
                                persistenceStatus.lastSync.switchedAt
                              )} · ${persistenceStatus.lastSync.synchronizedSessionCount} sessions synchronized`
                            : "The current backend is using its local state without a recorded migration event."}
                        </span>
                      </div>

                      {persistenceStatus.backendDetails.map((detail) => (
                        <div className="persistence-status-card" key={detail.backend}>
                          <div className="persistence-status-topline">
                            <strong>{formatPersistenceBackendLabel(detail.backend)}</strong>
                            <span
                              className={`persistence-badge persistence-badge-${detail.syncState}`}
                            >
                              {formatPersistenceSyncState(detail.syncState)}
                            </span>
                          </div>
                          <span>{detail.storageLabel}</span>
                          <span>
                            {detail.exists
                              ? `${detail.sessionCount} sessions · ${
                                  detail.latestUpdatedAt
                                    ? `latest ${formatSessionTimestamp(detail.latestUpdatedAt)}`
                                    : "no session writes yet"
                                }`
                              : "Local store file has not been created yet."}
                          </span>
                          {detail.backend !== persistenceStatus.backend ? (
                            <span>
                              {detail.differingSessionCount > 0
                                ? `${detail.differingSessionCount} sessions differ from the active backend.`
                                : "No session differences detected against the active backend."}
                            </span>
                          ) : (
                            <span>This is the backend currently serving local chat reads and writes.</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <label className="form-field">
                    <span>Backend</span>
                    <select
                      value={selectedPersistenceBackend}
                      onChange={(event) =>
                        setSelectedPersistenceBackend(event.target.value as ChatPersistenceBackend)
                      }
                      disabled={!persistenceStatus || persistenceState === "loading"}
                    >
                      {(persistenceStatus?.availableBackends ?? ["file", "sqlite"]).map((backend) => (
                        <option key={backend} value={backend}>
                          {backend === "sqlite" ? "SQLite" : "File JSON"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="console-actions">
                    <button
                      className="button button-secondary"
                      onClick={() => void handlePersistenceSwitch()}
                      disabled={!canSwitchPersistence}
                      type="button"
                    >
                      {persistenceState === "loading" ? "Switching..." : "Switch Backend"}
                    </button>
                  </div>
                  {alternateBackendStatus ? (
                    <p className="provider-note persistence-note">
                      {alternateBackendStatus.syncState === "in-sync"
                        ? `${formatPersistenceBackendLabel(alternateBackendStatus.backend)} is aligned with the active backend.`
                        : `${formatPersistenceBackendLabel(alternateBackendStatus.backend)} is ${formatPersistenceSyncState(
                            alternateBackendStatus.syncState
                          ).toLowerCase()} with ${alternateBackendStatus.differingSessionCount} differing sessions.`}
                    </p>
                  ) : null}
                </div>

                <div className="session-control-card">
                  <div className="mini-heading">Create Session</div>
                  <label className="form-field">
                    <span>New Session Title</span>
                    <input
                      type="text"
                      value={newSessionTitle}
                      onChange={(event) => setNewSessionTitle(event.target.value)}
                      placeholder="Late night reflection, product brainstorm, memory test..."
                    />
                  </label>
                  <div className="console-actions">
                    <button
                      className="button button-secondary"
                      onClick={() => void handleCreateSession()}
                      disabled={!canCreateSession}
                      type="button"
                    >
                      Create Session
                    </button>
                  </div>
                </div>

                <div className="session-control-card">
                  <div className="mini-heading">Import Session JSON</div>
                  <input
                    ref={sessionImportFileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="session-import-file-input"
                    onChange={(event) => void handleImportSessionFile(event)}
                  />
                  <label className="form-field">
                    <span>Imported Session Title</span>
                    <input
                      type="text"
                      value={sessionImportTitle}
                      onChange={(event) => setSessionImportTitle(event.target.value)}
                      placeholder="Recovered companion session..."
                    />
                  </label>
                  <label className="form-field">
                    <span>Exported JSON</span>
                    <textarea
                      className="session-import-textarea"
                      value={sessionImportJson}
                      onChange={(event) => setSessionImportJson(event.target.value)}
                      placeholder='Paste an exported session package here...'
                    />
                  </label>
                  <div className="console-actions">
                    <button
                      className="button button-secondary"
                      onClick={() => sessionImportFileInputRef.current?.click()}
                      type="button"
                    >
                      Choose JSON File
                    </button>
                    <button
                      className="button button-secondary"
                      onClick={() => void handleImportSession()}
                      disabled={!canImportSession}
                      type="button"
                    >
                      {sessionImportState === "loading" ? "Importing..." : "Import As New Session"}
                    </button>
                  </div>
                </div>

                <div className="session-control-card">
                  <div className="mini-heading">Manage Active Session</div>
                  {activeSession ? (
                    <>
                      <div className="session-active-summary">
                        <strong>{activeSession.title}</strong>
                        <span>
                          {activeSession.sessionId === defaultSessionId
                            ? "Main companion session. Always preserved, but its local history can be reset."
                            : "Optional local session. Can be renamed, reset, or removed."}
                        </span>
                      </div>

                      <label className="form-field">
                        <span>Session Title</span>
                        <input
                          type="text"
                          value={sessionRenameTitle}
                          onChange={(event) => setSessionRenameTitle(event.target.value)}
                          placeholder="Rename this session"
                          disabled={activeSession.sessionId === defaultSessionId}
                        />
                      </label>

                      <div className="session-action-row">
                        <button
                          className="button button-secondary"
                          onClick={() => void handleExportSession()}
                          disabled={!canExportSession}
                          type="button"
                        >
                          {sessionExportState === "loading" ? "Exporting..." : "Export Session JSON"}
                        </button>
                        <button
                          className="button button-secondary"
                          onClick={() => void handleResetSession()}
                          disabled={!activeSession.sessionId}
                          type="button"
                        >
                          Reset Session
                        </button>
                        <button
                          className="button button-secondary"
                          onClick={() => void handleRenameSession()}
                          disabled={!canRenameSession}
                          type="button"
                        >
                          Rename Session
                        </button>
                        <button
                          className="button button-danger"
                          onClick={() => void handleDeleteSession()}
                          disabled={activeSession.sessionId === defaultSessionId}
                          type="button"
                        >
                          Delete Session
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="provider-note">No local session is available yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="chat-layout">
            <div className="panel chat-panel">
              <div className="panel-header">
                <span>Conversation</span>
                <span className="panel-tag">{chatReady ? "Runtime Ready" : "Setup Required"}</span>
              </div>

              {chatRestoredAt ? (
                <div className="status-banner status-banner-info">
                  Restored local session history from {new Date(chatRestoredAt).toLocaleString()}.
                </div>
              ) : null}

              <div className="chat-log">
                {chatMessages.length === 0 ? (
                  <div className="empty-chat-state">
                    Save a provider configuration, then send the first message to start a live Waveary session.
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <article
                      className={`chat-bubble ${message.role === "assistant" ? "chat-bubble-assistant" : "chat-bubble-user"}`}
                      key={message.id}
                    >
                      <span className="chat-role">{message.role === "assistant" ? "Waveary" : "You"}</span>
                      <p>{message.content}</p>
                    </article>
                  ))
                )}
              </div>

              <div className="chat-composer">
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Tell Waveary something worth remembering..."
                  disabled={!chatReady || chatState === "loading"}
                />
                <div className="console-actions">
                  <button
                    className="button button-primary"
                    onClick={() => void handleSendMessage()}
                    disabled={!chatReady || !chatInput.trim() || chatState === "loading"}
                  >
                    {chatState === "loading" ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </div>

              {sessionExportJson ? (
                <div className="session-export-panel">
                  <div className="panel-header">
                    <span>Session Export</span>
                    <span className="panel-tag">Structured JSON</span>
                  </div>
                  <p className="provider-note">
                    This export package includes conversation, persisted memories, relationship state, timeline events, and latest insights for the active session.
                  </p>
                  <pre className="session-export-block">
                    <code>{sessionExportJson}</code>
                  </pre>
                </div>
              ) : null}
            </div>

            <div className="panel insight-panel">
              <div className="panel-header">
                <span>Runtime Signals</span>
                <span className="panel-tag">Memory + Relationship</span>
              </div>

              {chatInsights ? (
                <div className="insight-stack">
                  <div className="signal-metrics">
                    <div className="signal-metric-card">
                      <span>Relationship Stage</span>
                      <strong>{chatInsights.relationship.stage}</strong>
                    </div>
                    <div className="signal-metric-card">
                      <span>Affinity</span>
                      <strong>{chatInsights.relationship.affinityScore.toFixed(2)}</strong>
                    </div>
                    <div className="signal-metric-card">
                      <span>Trust</span>
                      <strong>{chatInsights.relationship.trustScore.toFixed(2)}</strong>
                    </div>
                    <div className="signal-metric-card">
                      <span>Stability</span>
                      <strong>{chatInsights.relationship.stabilityScore.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="insight-card">
                    <div className="mini-heading">Detected Emotion</div>
                    <p>
                      {chatInsights.emotion
                        ? `${chatInsights.emotion.primaryEmotion} (${chatInsights.emotion.intensity.toFixed(2)})`
                        : "No strong emotion signal detected for the latest turn."}
                    </p>
                  </div>

                  <div className="insight-card">
                    <div className="mini-heading">Recalled Memories</div>
                    {chatInsights.recalledMemories.length > 0 ? (
                      <ul className="insight-list">
                        {chatInsights.recalledMemories.map((memory) => (
                          <li key={memory}>{memory}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No recalled memories yet.</p>
                    )}
                  </div>

                  <div className="insight-card">
                    <div className="mini-heading">Stored Memories</div>
                    {chatInsights.storedMemories.length > 0 ? (
                      <ul className="insight-list">
                        {chatInsights.storedMemories.map((memory) => (
                          <li key={memory}>{memory}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No memory candidates were stored in the latest turn.</p>
                    )}
                  </div>

                  <div className="insight-card">
                    <div className="mini-heading">Timeline</div>
                    {chatInsights.timeline.length > 0 ? (
                      <ul className="insight-list">
                        {chatInsights.timeline.map((event) => (
                          <li key={`${event.eventTime}-${event.title}`}>
                            <strong>{event.title}</strong>
                            <span>{`${event.type} · ${event.eventTime}`}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No timeline events yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-chat-state">
                  Send a message to see memory recall, relationship changes, and timeline events from the runtime.
                </div>
              )}
            </div>
          </div>

          <div className="panel archive-panel">
            <div className="panel-header">
              <span>Persisted Session Archive</span>
              <span className="panel-tag">Memory + Timeline + Relationship</span>
            </div>

            {hasSessionArchive ? (
              <div className="archive-grid">
                <div className="archive-card">
                  <div className="mini-heading">Relationship Snapshot</div>
                  {sessionRelationship ? (
                    <div className="signal-metrics archive-metrics">
                      <div className="signal-metric-card">
                        <span>Stage</span>
                        <strong>{sessionRelationship.stage}</strong>
                      </div>
                      <div className="signal-metric-card">
                        <span>Affinity</span>
                        <strong>{sessionRelationship.affinityScore.toFixed(2)}</strong>
                      </div>
                      <div className="signal-metric-card">
                        <span>Trust</span>
                        <strong>{sessionRelationship.trustScore.toFixed(2)}</strong>
                      </div>
                      <div className="signal-metric-card">
                        <span>Stability</span>
                        <strong>{sessionRelationship.stabilityScore.toFixed(2)}</strong>
                      </div>
                    </div>
                  ) : (
                    <p>No persisted relationship snapshot yet.</p>
                  )}
                </div>

                <div className="archive-card">
                  <div className="mini-heading">Session Memory Archive</div>
                  {sessionMemoryArchive.length > 0 ? (
                    <ul className="insight-list archive-list">
                      {sessionMemoryArchive.map((memory) => (
                        <li key={memory.id}>
                          <strong>{formatMemoryType(memory.type)}</strong>
                          <span>{memory.content}</span>
                          <span>{`importance ${memory.importance.toFixed(2)} 路 ${formatSessionTimestamp(
                            memory.createdAt
                          )}`}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No persisted memories yet.</p>
                  )}
                </div>

                <div className="archive-card archive-card-wide">
                  <div className="mini-heading">Session Timeline</div>
                  {sessionTimelineEvents.length > 0 ? (
                    <ul className="insight-list archive-list">
                      {sessionTimelineEvents.map((event) => (
                        <li key={event.id}>
                          <strong>{event.title}</strong>
                          <span>{event.description}</span>
                          <span>{`${event.type} 路 ${formatSessionTimestamp(event.eventTime)} 路 importance ${event.importance.toFixed(2)}`}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No persisted timeline events yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-chat-state">
                Send a message worth remembering. This area will show the session&apos;s persisted memory archive,
                relationship snapshot, and timeline after reloads.
              </div>
            )}
          </div>
        </section>

        <section className="section-grid section-block" id="roadmap">
          <div className="section-heading">
            <span className="eyebrow">Execution Roadmap</span>
            <h2>Build the companion layer first. Expand the experience second.</h2>
          </div>
          <div className="roadmap-grid">
            {roadmap.map((phase) => (
              <article className="panel roadmap-card" key={phase.version}>
                <div className="roadmap-topline">
                  <span>{phase.version}</span>
                  <span>{phase.timeframe}</span>
                </div>
                <h3>{phase.goal}</h3>
                <ul>
                  {phase.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : `Request failed with status ${response.status}.`);
  }

  return payload as T;
}

function formatSessionTimestamp(updatedAt: string): string {
  return new Date(updatedAt).toLocaleString();
}

function formatPersistenceBackendLabel(backend: ChatPersistenceBackend | null): string {
  if (backend === "sqlite") {
    return "SQLite";
  }

  if (backend === "file") {
    return "File JSON";
  }

  return "Unknown";
}

function formatPersistenceSyncState(state: ChatPersistenceSyncState): string {
  switch (state) {
    case "active":
      return "Active";
    case "in-sync":
      return "In Sync";
    case "behind":
      return "Behind";
    case "ahead":
      return "Ahead";
    case "diverged":
      return "Diverged";
    default:
      return state;
  }
}

function formatMemoryType(type: string): string {
  switch (type) {
    case "life_event":
      return "Life Event";
    case "preference":
      return "Preference";
    case "relationship":
      return "Relationship";
    case "reflection":
      return "Reflection";
    case "fact":
      return "Fact";
    default:
      return type;
  }
}

function downloadSessionExport(exported: ExportedChatSession): void {
  const blob = new Blob([JSON.stringify(exported, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeTitle = exported.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "waveary-session";

  anchor.href = url;
  anchor.download = `${safeTitle}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}
