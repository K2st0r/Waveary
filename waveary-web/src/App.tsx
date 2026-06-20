import { useEffect, useState } from "react";
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

const CHAT_SESSION_ID = "waveary-web-session-1";

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

  useEffect(() => {
    void loadInitialState();
  }, []);

  async function loadInitialState(): Promise<void> {
    setLoadState("loading");

    try {
      const [presetResponse, configResponse] = await Promise.all([
        fetchJson<{ presets: ProviderPreset[] }>("/api/provider/presets"),
        fetchJson<{ config?: SavedProviderConfig }>("/api/provider/config")
      ]);

      const nextPresets = presetResponse.presets;
      const nextConfig = configResponse.config ?? null;
      const fallbackPreset = nextPresets[0];

      setPresets(nextPresets);
      setSavedConfig(nextConfig);

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
        setStatusMessage("Choose a provider and fetch the models available to your API key.");
      } else {
        setStatusMessage("No provider presets are available.");
      }

      setLoadState("success");
    } catch (error) {
      setLoadState("error");
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
    } catch (error) {
      setSaveState("error");
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
          sessionId: CHAT_SESSION_ID,
          message: trimmed
        })
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.reply
      };

      setChatMessages((current) => [...current, assistantMessage]);
      setChatInsights(response);
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

  const isBusy = loadState === "loading" || modelsState === "loading" || saveState === "loading";
  const canFetchModels = Boolean(selectedProvider && baseURL.trim() && apiKey.trim()) && modelsState !== "loading";
  const canSaveConfig =
    Boolean(selectedProvider && baseURL.trim() && apiKey.trim() && selectedModel) && saveState !== "loading";
  const selectedPreset = presets.find((preset) => preset.id === selectedProvider) ?? null;
  const chatReady = Boolean(savedConfig?.provider && savedConfig.model);

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

          <div className="chat-layout">
            <div className="panel chat-panel">
              <div className="panel-header">
                <span>Conversation</span>
                <span className="panel-tag">{chatReady ? "Runtime Ready" : "Setup Required"}</span>
              </div>

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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}
