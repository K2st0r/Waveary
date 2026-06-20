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

const providers = [
  "OpenAI",
  "DeepSeek",
  "DashScope",
  "Volcengine Ark",
  "SiliconFlow"
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
  "Run Waveary"
] as const;

export function App(): ReactElement {
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
          <a href="#providers">Providers</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#structure">Structure</a>
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
              Waveary is an open source framework that gives any model long-term
              memory, relationship growth, life timeline awareness, and the
              capacity to stay with a user over time.
            </p>
            <p className="hero-support">
              It is not an AI girlfriend wrapper. It is a continuity layer for
              digital companionship.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#providers">
                Provider Compatibility
              </a>
              <a className="button button-secondary" href="#roadmap">
                View Roadmap
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
                  <p>Provider selection saved for future sessions.</p>
                </div>
                <div className="timeline-row">
                  <span>07/02</span>
                  <p>Relationship state reflects repeated late-night talks.</p>
                </div>
                <div className="timeline-row">
                  <span>08/10</span>
                  <p>Anniversary memory becomes a proactive care trigger.</p>
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

        <section className="section-grid section-block feature-band" id="providers">
          <div className="section-heading">
            <span className="eyebrow">Provider Compatibility</span>
            <h2>Connect broad model ecosystems without locking Waveary to one vendor.</h2>
            <p>
              The current runtime uses an OpenAI-compatible provider layer so
              domestic and global platforms can share one setup flow.
            </p>
          </div>
          <div className="provider-layout">
            <div className="panel provider-panel">
              <div className="panel-header">
                <span>Supported Setup Flow</span>
                <span className="panel-tag">Live now</span>
              </div>
              <ol className="step-list">
                {setupSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <div className="command-block">
                <code>npm run setup:provider</code>
                <code>npm run demo:provider</code>
              </div>
            </div>

            <div className="panel provider-panel">
              <div className="panel-header">
                <span>Preset Providers</span>
                <span className="panel-tag">OpenAI-compatible</span>
              </div>
              <div className="provider-list">
                {providers.map((provider) => (
                  <span className="provider-chip" key={provider}>
                    {provider}
                  </span>
                ))}
              </div>
              <p className="provider-note">
                Base URL, API key, and discovered models stay configurable so
                the framework can adapt as provider ecosystems change.
              </p>
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

        <section className="section-grid section-block repo-block" id="structure">
          <div className="section-heading">
            <span className="eyebrow">Repository Structure</span>
            <h2>Separate the framework, memory system, and product surfaces cleanly.</h2>
          </div>
          <div className="structure-layout">
            <div className="panel structure-panel">
              <pre>{`waveary/
  waveary-core
  waveary-memory
  waveary-web
  waveary-mobile
  waveary-voice
  waveary-docs`}</pre>
            </div>
            <div className="panel structure-panel">
              <p>
                `waveary-core` owns runtime orchestration. `waveary-memory`
                owns memory extraction and storage. `waveary-web` becomes the
                official interface layer without collapsing framework boundaries.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
import type { ReactElement } from "react";
