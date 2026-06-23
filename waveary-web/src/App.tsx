import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import {
  buildProactiveMessageDraft,
  formatProactiveDraftTone,
  resolveNotificationDayPart,
  type Locale,
  type ProactiveCareDecision as ProactiveMessageDecision,
  type ProactiveMessageDraft,
  type WavearyPermissionProfile
} from "./proactive-message-drafts";

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

interface SavedVoiceConfig {
  model: string;
  voice: string;
  format: "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm";
  qualityProfile: string;
  sttModel: string;
  providerMode: "shared" | "dedicated";
  provider: string;
  baseURL: string;
  apiKey: string;
  appId: string;
  accessKeyId: string;
  secretAccessKey: string;
  resourceId: string;
  cluster: string;
  endpointPath: string;
  engine: string;
  speaker: string;
  referenceVoiceId: string;
  textLanguage: string;
  promptLanguage: string;
  referenceTranscript: string;
  stylePrompt: string;
  styleStrength: number | null;
  temperature: number | null;
  topP: number | null;
}

interface VoicePresetDescriptor {
  id: string;
  label: string;
  description: string;
  model: string;
  voice: string;
  format: string;
}

interface VoiceProviderPreset {
  id: string;
  label: string;
  provider: string;
  providerType:
    | "openai-compatible"
    | "gemini"
    | "fish-audio"
    | "doubao"
    | "doubao-legacy"
    | "local";
  baseURL: string;
  voiceFieldMode?: "select" | "input";
  defaultModel?: string;
  defaultVoice?: string;
  notes?: string;
}

interface VoiceOptionDescriptor {
  id: string;
  label: string;
}

interface VoiceCatalogResponse {
  providerType:
    | "openai-compatible"
    | "gemini"
    | "fish-audio"
    | "doubao"
    | "doubao-legacy"
    | "local";
  models: ModelDescriptor[];
  voices: VoiceOptionDescriptor[];
  voiceFieldMode: "select" | "input";
  defaultModel?: string;
  defaultVoice?: string;
  notes?: string;
  source?: "static" | "provider";
}

interface ModelDescriptor {
  id: string;
  provider: string;
  label?: string;
  contextWindow?: number;
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
  delivery?: {
    style?: "soft" | "warm" | "concerned" | "quiet" | "bright" | "playful" | "steady";
    pace?: "slower" | "steady" | "lighter";
    closeness?: "careful" | "present" | "close";
    expressiveness?: "restrained" | "natural" | "open";
    voiceStyle?: string;
    instruction?: string;
    summary?: string;
  };
  recalledMemories: string[];
  storedMemories: string[];
  pendingLocalAction?: PendingLocalAction | null;
  timeline: Array<{
    title: string;
    type: string;
    eventTime: string;
  }>;
}

interface VoiceSpeakPlanResponse {
  provider: string;
  mode: "browser-speech" | "audio";
  plan?: {
    mode: "browser-speech";
    lang: string;
    voiceLabel: string;
    styleLabel: string;
    rate: number;
    pitch: number;
    volume: number;
    preDelayMs: number;
    postDelayMs: number;
    preferredVoiceKeywords: string[];
  };
  audio?: {
    mimeType: string;
    base64: string;
  };
  metadata?: {
    model: string;
    voice: string;
    qualityProfile?: string;
    instructions?: string;
  };
  routing: VoiceRoutingStatus;
}

interface VoiceConfigResponse {
  config: SavedVoiceConfig;
  presets: VoicePresetDescriptor[];
  routing: VoiceRoutingStatus;
}

interface VoiceTranscribeResponse {
  provider: string;
  text: string;
  metadata?: {
    model?: string;
    language?: string;
  };
  routing: VoiceRoutingStatus;
}

interface VoiceRoutingStatus {
  mode: "shared" | "dedicated";
  target: "provider-audio" | "browser-fallback";
  providerType: "shared-chat-provider" | "openai-compatible" | "gemini" | "fish-audio" | "doubao" | "local" | "unknown";
  providerLabel: string;
  ready: boolean;
  reasonCode: string;
  summary: string;
  missingFields: Array<"provider" | "baseURL" | "apiKey" | "appId" | "resourceId">;
  attemptedProviderAudio?: boolean;
  fallbackReason?: string;
}

interface PendingLocalAction {
  id: string;
  kind:
    | "open_url"
    | "open_folder"
    | "launch_app"
    | "browser_extract_text"
    | "browser_search_text"
    | "browser_list_clickable"
    | "browser_click_text";
  label: string;
  target: string;
  targetLabel: string;
  summary: string;
}

interface ChatTurnTimeContext {
  localTimeIso: string;
  timeZone?: string;
  locale?: string;
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

interface ProactiveCarePolicy {
  enabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  maxDailyReachouts: number;
  allowMealCare: boolean;
  allowSleepCare: boolean;
  allowAbsenceCheckins: boolean;
}

interface ProactiveCareState {
  dailyReachoutsSent: number;
  unansweredReachoutCount: number;
  lastReachOutAt?: string;
}

interface ProactiveCareDecision extends ProactiveMessageDecision {}

interface ProactiveCareEvaluationResult {
  decision: ProactiveCareDecision;
  draft: ProactiveMessageDraft;
  session: ChatSessionSnapshot | null;
}

type ProactiveAutoCheckOutcome = "notified" | "recommended" | "wait";

type ProactiveCareIntent = NonNullable<ProactiveCareDecision["intent"]>;
type ProactiveCareUrgency = NonNullable<ProactiveCareDecision["urgency"]>;

interface ChatSessionSnapshot {
  sessionId: string;
  messages: ChatMessage[];
  latestInsights: ChatTurnResponse | null;
  proactiveCarePolicy: ProactiveCarePolicy;
  proactiveCareState: ProactiveCareState;
  memoryArchive: SessionMemoryArchiveItem[];
  relationship: SessionRelationshipSnapshot | null;
  timelineEvents: SessionTimelineEvent[];
  updatedAt: string;
}

interface ExportedChatSession {
  schemaVersion?: string;
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

interface LocalActionRouteResult {
  session: ChatSessionSnapshot | null;
  result: {
    status: "executed" | "dismissed";
    message: string;
  };
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
  sample: ExportedChatSession;
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

type LoadState = "idle" | "loading" | "success" | "error";
type AppPage = "home" | "console" | "chat" | "roadmap";
type BrowserNotificationPermissionState = NotificationPermission | "unsupported";
type PermissionLevel = WavearyPermissionProfile["browserNotifications"];
type PermissionPresetMode = "limited" | "elevated" | "full";
type VoicePlaybackState = "idle" | "planning" | "speaking" | "error";
type SpeechInputState = "idle" | "listening" | "processing" | "unsupported" | "error";
type VoiceConversationResumeReason = "reply-finished" | "retry-listening";

interface BrowserSpeechRecognitionAlternative {
  transcript: string;
  confidence?: number;
}

interface BrowserSpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: BrowserSpeechRecognitionAlternative;
}

interface BrowserSpeechRecognitionResultList {
  length: number;
  [index: number]: BrowserSpeechRecognitionResult;
}

interface BrowserSpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: BrowserSpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface BrowserSpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognitionInstance;

interface BrowserMediaRecorder extends EventTarget {
  mimeType: string;
  state: "inactive" | "recording" | "paused";
  ondataavailable: ((event: BlobEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onstop: ((event: Event) => void) | null;
  start(timeslice?: number): void;
  stop(): void;
}

type BrowserMediaRecorderConstructor = new (
  stream: MediaStream,
  options?: { mimeType?: string }
) => BrowserMediaRecorder;

const PROVIDER_STT_MAX_CAPTURE_MS = 12000;
const PROVIDER_STT_MIN_CAPTURE_MS = 900;
const PROVIDER_STT_SILENCE_GRACE_MS = 1300;
const PROVIDER_STT_ACTIVITY_THRESHOLD = 0.028;

interface PageLocation {
  page: AppPage;
  sectionId?: string;
}

const zhCopy = {
  brandSubtitle: "回响之境",
  brandCaption: "数字生命陪伴框架",
  slogan: "念念不忘，终有回响。",
  nav: ["首页", "介绍", "引擎", "结构", "控制台", "路线图"] as const,
  hero: {
    eyebrow: "Project Waveary",
    chip: "Waveary CE",
    kicker: "数字生命陪伴框架",
    title: ["念念不忘，", "终有回响。"] as const,
    lead:
      "Waveary 是一个开源框架，为任意模型赋予长期记忆、关系成长、人生时间轴，以及长期陪伴用户的能力。",
    support:
      "Waveary 不试图创造更聪明的聊天机器人。它在构建一层连续性基础设施，让任何模型都能在用户的人生里记住、理解并持续成长。",
    primary: "阅读框架",
    secondary: "查看引擎栈"
  },
  principles: ["记忆优先于模型。", "关系优先于功能。", "陪伴优先于智能。"] as const,
  introStatements: [
    "Waveary 被设计为数字陪伴场景下的长期连续性基础层。",
    "它让兼容模型拥有持久记忆、关系状态与人生时间轴。",
    "它追求的不是单轮新鲜感，而是跨越数月、数年与真实人生的稳定一致性。"
  ] as const,
  heroCards: {
    definitionLabel: "项目定义",
    definitionTitle: "为需要记忆、连续性与陪伴逻辑的模型提供一层操作系统。",
    definitionBody:
      "Waveary 不应再被理解为某种 AI 角色应用，而更像是一层位于模型输出与用户人生经历之间的连续性框架。",
    positioningLabel: "定位",
    positioningTitle: "框架优先，陪伴其次，默认保持供应商中立。",
    positioningBody: "不是 AI 女友包装。不是通用聊天壳。不是单一厂商绑定陷阱。",
    audienceLabel: "面向谁",
    audienceTitle: "面向建立长期数字陪伴产品与系统的团队。",
    audienceBody: "当连续性、记忆与关系状态比单轮惊艳更重要时，就该用 Waveary。"
  },
  intro: {
    caption: "框架介绍",
    title: "Waveary 是模型输出与用户真实人生之间的连续性层。",
    description:
      "它旨在为大模型提供稳定的记忆底座、关系系统、人生时间轴，以及长期数字陪伴的基础能力。",
    essay: [
      "大多数 AI 产品是靠单次回答看起来够不够聪明来评判的。Waveary 则是看系统能否长期保持一致、记住重要的事，并在供应商或会话切换后关系仍不坍塌。",
      "这意味着记忆不是附属功能，关系不是 prompt 风味，个人历史不是可随手丢弃的日志，它们都是一等系统能力。"
    ] as const,
    panels: [
      {
        label: "开源核心",
        title: "它是一层框架，不是一个主题化聊天壳。",
        description:
          "Waveary 把连续性做成产品基础设施，让记忆、关系、时间轴与情绪状态不会在单轮结束后一起蒸发。"
      },
      {
        label: "模型无关",
        title: "自带供应商，但保持连续性层稳定。",
        description:
          "供应商配置、模型发现与运行时编排彼此解耦，陪伴层不会因为绑定某一家模型而失去独立性。"
      },
      {
        label: "陪伴逻辑",
        title: "跨越用户人生去记住、理解并成长。",
        description:
          "系统的目标是持续累积上下文、反映关系变化，并把重要人生事件组织成可回访的个人历史。"
      }
    ] as const,
    thesisCaption: "核心主张",
    thesisTitle: "记忆优先于模型。关系优先于功能。陪伴优先于智能。",
    thesisBody:
      "重点不是让聊天机器人听起来更戏剧化，而是让陪伴在底层模型变化时仍能长期保持一致。"
  },
  frameworkLayers: [
    { title: "记忆连续性", description: "把对话碎片变成可检索、可持久化的记忆资产。" },
    { title: "关系连续性", description: "把信任、熟悉度与阶段变化建模为真实运行时状态。" },
    { title: "时间轴连续性", description: "把重要时刻保留为人生序列，而不是一次性日志。" },
    { title: "情绪连续性", description: "跟踪短期情绪与长期语气，让陪伴更稳定一致。" }
  ] as const,
  manifesto: {
    caption: "框架定位",
    title: "不是角色扮演外壳，而是数字生命陪伴的连续性系统。",
    description:
      "Waveary 位于界面层与模型供应商之间，为任何兼容模型提供持久记忆层、关系状态、人生时间轴，以及情绪与语音存在感的基础。",
    quote:
      "它不试图创造更聪明的 AI。它试图创造一个能够记住、理解、成长并长期陪伴用户的人生伙伴。",
    points: [
      {
        title: "替代短期 Prompt 戏法",
        description: "把连续性下沉到系统架构中，让记忆与关系不会在当前轮结束后立刻消失。"
      },
      {
        title: "让供应商切换可存活",
        description: "保持配置、模型发现与运行调用可替换，而陪伴层本身保持稳定。"
      },
      {
        title: "把个人历史当成产品基础设施",
        description: "把被记住的事实、重要时刻与关系变化，沉淀成可使用的人生档案。"
      }
    ] as const
  },
  engines: {
    caption: "核心引擎",
    title: "一个为连续性而生，而非为短期新鲜感而生的框架栈。",
    description: "每个引擎负责一项稳定的连续性能力，让产品层保持表达力，但不偷走运行时职责。",
    lens: "架构视角",
    foundation:
      "整个产品被组织成连续性操作层：模型接入、记忆、关系状态、归档持久化与未来语音能力彼此独立。",
    cards: [
      { acronym: "WME", name: "Waveary Memory Engine", summary: "把对话沉淀为持久记忆，而不是一次性上下文。" },
      { acronym: "WRE", name: "Waveary Relationship Engine", summary: "把关系成长建模为状态、信号与长期信任。" },
      { acronym: "WTE", name: "Waveary Timeline Engine", summary: "把人生事件组织成可被回忆的个人历史。" },
      { acronym: "WEE", name: "Waveary Emotion Engine", summary: "跟踪情绪状态，指导语气、关怀与连续性。" },
      { acronym: "WVE", name: "Waveary Voice Engine", summary: "为从文字陪伴走向实时语音铺路。" }
    ] as const
  },
  structure: {
    caption: "项目结构",
    title: "用仓库形态把连续性逻辑与产品表层严格分开。",
    description: "Waveary 正被组织成模块化框架，让记忆、运行时、界面与未来语音层不会坍缩成一个应用。",
    plan: "仓库规划",
    modules: [
      { name: "waveary-core", role: "运行时编排、供应商抽象与连续性领域契约。" },
      { name: "waveary-web", role: "官方 Web 表层，负责项目表达、配置流程与运行时入口。" },
      { name: "waveary-memory", role: "记忆提取、存储、检索与评分行为。" },
      { name: "waveary-voice", role: "面向实时与全双工陪伴的未来语音交互层。" }
    ] as const
  },
  console: {
    caption: "陪伴控制台",
    title: "官方交互表层放在介绍之后，而不是把介绍淹没在控制台里。",
    description: "首页先解释框架；这里才开始展示当前 Web 参考实现如何完成配置、连续性与运行时行为。",
    summary: [
      ["运行路径", "供应商选择与模型发现留在本地 API 层，而不是塞进浏览器客户端运行时。"],
      ["会话层", "主会话与附加会话并存，且重置、重命名、导入导出都保持本地可控。"],
      ["运行状态", "实时对话已经返回回复文本，以及记忆、关系、情绪与时间轴信号。"],
      ["持久档案", "会话历史可跨进程重启保留，并可在文件或 SQLite 持久化之间迁移。"]
    ] as const,
    flow: [
      ["界面 01", "供应商接入", "选择厂商、验证凭据、拉取模型，并保存一条稳定可用的运行路径。"],
      ["界面 02", "会话连续性", "会话身份、持久化后端、导入、导出、重置与归档都可观察、可管理。"],
      ["界面 03", "运行时观测", "对话、信号与持久归档被拆分为主画布与检查侧栏。"]
    ] as const
  },
  setup: {
    caption: "供应商配置",
    title: "选择供应商，查看你的密钥可用模型，并固定一条可用运行路径。",
    description: "这套浏览器原生配置流把供应商逻辑保留在服务端，本页面只负责交互体验。",
    sequence: "配置顺序",
    interactive: "交互式",
    steps: ["选择供应商", "输入 API Key", "获取模型", "选择模型", "保存配置", "进入聊天"] as const,
    savedConfiguration: "已保存配置",
    noSavedConfiguration: "还没有已保存的供应商配置。完成右侧流程后即可创建。",
    presetCoverage: "预设覆盖",
    setupConsole: "配置控制台",
    localApi: "本地 API",
    provider: "供应商",
    providerPlaceholder: "选择一个供应商",
    baseUrl: "Base URL",
    apiKey: "API Key",
    selectedPreset: "当前预设",
    selectedPresetFallback: "先选择一个供应商预设，从已知兼容端点开始。",
    selectedPresetSuffix: "默认会使用其 OpenAI 兼容端点，除非你手动覆盖 Base URL。",
    fetchModels: "获取可用模型",
    fetchingModels: "正在获取模型...",
    models: "可用模型",
    model: "模型",
    modelsHint: "输入供应商、Base URL 与 API Key 后再获取模型。结果直接来自供应商的 `/models` 接口。",
    saveConfig: "保存供应商配置",
    saving: "正在保存..."
  },
  runtime: {
    caption: "实时运行时",
    title: "运行当前 Waveary 浏览器流程，查看会话、档案可见性与连续性信号。",
    description: "这个参考壳层已经能返回真实回复，以及来自底层运行时的记忆召回、关系变化与时间轴输出。",
    sessionLayer: "会话层",
    sessionTag: "主会话 + 附加会话",
    main: "主会话",
    session: "会话",
    messages: "条消息",
    persistence: "持久化后端",
    loading: "加载中...",
    currentStore: "当前本地存储：",
    loadingPersistence: "正在加载当前聊天持久化后端。",
    lastSync: "最近同步",
    noSwitch: "暂无切换记录",
    noMigration: "当前后端正在使用本地状态，但还没有记录到迁移事件。",
    sessionsSynced: "个会话已同步",
    localStoreMissing: "本地存储文件尚未创建。",
    latest: "最近写入",
    noWrites: "尚无会话写入",
    sessionsUnit: "个会话",
    activeBackendDescription: "这个后端当前正在提供本地聊天的读写服务。",
    noSessionDiff: "与当前激活后端没有检测到会话差异。",
    backend: "后端",
    switchBackend: "切换后端",
    switching: "正在切换...",
    createSession: "创建会话",
    newSessionTitle: "新会话标题",
    newSessionPlaceholder: "深夜回忆、产品脑暴、记忆测试……",
    importSession: "导入会话 JSON",
    packageRules: "导入规则",
    currentSchema: "当前 schema 版本：",
    topLevelFields: "顶层字段",
    requiredArrays: "必需的快照数组",
    importedSessionTitle: "导入后的会话标题",
    importedSessionPlaceholder: "恢复的陪伴会话……",
    exportedJson: "导出的 JSON",
    exportedJsonPlaceholder: "把导出的会话包粘贴到这里……",
    chooseJsonFile: "选择 JSON 文件",
    loadSample: "载入示例包",
    importAsNew: "导入为新会话",
    importing: "正在导入...",
    importDiagnostics: "导入诊断",
    manageSession: "管理当前会话",
    mainSessionDescription: "这是主陪伴会话。它始终保留，但本地历史可以被重置。",
    optionalSessionDescription: "这是附加本地会话。可以重命名、重置或删除。",
    sessionTitle: "会话标题",
    renamePlaceholder: "重命名这个会话",
    exportSession: "导出会话 JSON",
    exporting: "正在导出...",
    resetSession: "重置会话",
    renameSession: "重命名会话",
    deleteSession: "删除会话",
    noLocalSession: "当前还没有可用的本地会话。",
    canvas: "对话画布",
    runtimeReady: "运行时已就绪",
    setupRequired: "需要先配置",
    restored: "已恢复本地会话历史，时间：",
    emptyChat: "先保存一套供应商配置，再发送第一条消息以启动实时 Waveary 会话。",
    you: "你",
    assistant: "Waveary",
    placeholder: "告诉 Waveary 一件值得被记住的事……",
    sending: "正在发送...",
    send: "发送消息",
    sessionExport: "会话导出",
    structuredJson: "结构化 JSON",
    exportDescription: "该导出包包含当前会话的对话、持久记忆、关系状态、时间轴事件与最新运行时洞察。",
    importSafety: "导入安全",
    currentSchemaShort: "当前 schema：",
    proactiveCare: "主动关怀",
    proactiveCareTag: "WPCE",
    proactiveCareDescription: "查看并保存当前会话的主动关怀策略，然后基于持久化状态做一次即时评估。",
    proactiveEnabled: "启用主动关怀",
    quietHoursStart: "静默开始",
    quietHoursEnd: "静默结束",
    maxDailyReachouts: "每日最多触达",
    allowMealCare: "允许用餐关怀",
    allowSleepCare: "允许睡眠关怀",
    allowAbsenceCheckins: "允许失联关怀",
    dailyReachoutsSent: "今日已触达",
    unansweredReachoutCount: "未回应次数",
    lastReachOutAt: "上次触达",
    noReachOutYet: "尚未记录主动触达。",
    saveProactiveSettings: "保存关怀设置",
    savingProactiveSettings: "正在保存...",
    evaluateProactiveNow: "立即评估",
    evaluatingProactive: "正在评估...",
    proactiveSettingsSaved: "当前会话的主动关怀设置已保存。",
    proactiveEvaluationReady: "已完成当前会话的主动关怀评估。",
    proactiveDecision: "评估结果",
    proactiveShouldReachOut: "建议触达",
    proactiveIntent: "触达意图",
    proactiveUrgency: "紧急程度",
    proactiveTone: "建议语气",
    proactiveReasons: "决策原因",
    proactiveSuggestedMessage: "建议消息草稿",
    proactiveSuggestedDelay: "建议延迟",
    proactiveEvaluatedAt: "评估时间",
    proactiveNoDecision: "还没有执行主动关怀评估。",
    browserNotifications: "浏览器通知",
    notificationPermission: "通知权限",
    notificationAutoDelivery: "建议触达时自动发通知",
    notificationHint: "仅在当前浏览器本地生效。评估结果为建议触达且你已授权时，Waveary 才会投递通知。",
    proactiveLocalLoop: "本地巡检循环",
    proactiveLocalLoopEnabled: "当前标签页可见时定期评估",
    proactiveLocalLoopInterval: "评估间隔",
    proactiveLocalLoopHint: "只在当前浏览器标签页打开且可见时运行，不会在后台静默执行。",
    proactiveLocalLoopLastRun: "上次巡检",
    proactiveLocalLoopOutcome: "最近结果",
    proactiveLocalLoopNever: "尚未执行本地巡检。",
    proactiveAutoOutcomeNotified: "已完成通知投递",
    proactiveAutoOutcomeRecommended: "建议触达，但本轮未投递通知",
    proactiveAutoOutcomeWait: "当前继续等待更合适",
    requestNotificationPermission: "请求通知权限",
    requestingNotificationPermission: "请求中...",
    notificationDelivered: "已发送浏览器通知。",
    notificationNeedsPermission: "通知开关已打开，但浏览器通知权限还没有授权。",
    notificationNoReachout: "这次评估没有建议主动触达，因此没有发送通知。",
    permissions: "权限中心",
    permissionsTag: "Consent",
    permissionsDescription: "用户应当自主决定 Waveary 能看见什么、能提醒什么、未来能做什么。所有更高权限都应该显式授权、可随时撤回。",
    permissionsHint: "这里先管理本地前端权限模型。尚未落地的能力会先保留为策略位，而不是偷偷开启。",
    permissionBrowserNotifications: "浏览器通知",
    permissionProactiveNotifications: "主动关怀通知",
    permissionTimeAwareness: "时间感知",
    permissionDesktopPresence: "桌面状态感知",
    permissionLocalActions: "本地动作执行",
    permissionAllow: "允许",
    permissionAsk: "按需询问",
    permissionDeny: "拒绝",
    permissionNotImplemented: "尚未实现，仅记录你的授权偏好。",
    permissionSaved: "已保存本地权限偏好。",
    yes: "是",
    no: "否",
    minutes: "分钟",
    signals: "运行时信号",
    signalsTag: "记忆 + 关系",
    relationshipStage: "关系阶段",
    affinity: "亲密度",
    trust: "信任度",
    stability: "稳定度",
    emotion: "识别情绪",
    noEmotion: "最新一轮没有检测到明显情绪信号。",
    recalledMemories: "召回记忆",
    noRecalled: "暂时还没有召回记忆。",
    storedMemories: "写入记忆",
    noStored: "最新一轮没有存入新的记忆候选。",
    timeline: "时间轴",
    noTimeline: "暂时还没有时间轴事件。",
    runtimeHint: "发送一条消息后，这里会显示记忆召回、关系变化与时间轴事件。",
    archive: "持久会话档案",
    archiveTag: "记忆 + 时间轴 + 关系",
    relationshipSnapshot: "关系快照",
    noRelationshipSnapshot: "还没有持久化的关系快照。",
    memoryArchive: "会话记忆档案",
    noPersistedMemories: "还没有持久化记忆。",
    sessionTimeline: "会话时间轴",
    noPersistedTimeline: "还没有持久化时间轴事件。",
    archiveHint: "发送一条值得记住的消息。重新加载后，这里会显示该会话的持久记忆档案、关系快照与时间轴。"
  },
  roadmap: {
    caption: "执行路线图",
    title: "先把陪伴层做稳，再逐步扩展体验。",
    phases: [
      { version: "V0.1", timeframe: "30 天", goal: "构建第一个可用的开源数字陪伴框架。", items: ["聊天", "长期记忆", "时间轴", "关系成长"] },
      { version: "V0.2", timeframe: "60 天", goal: "从连续性扩展到情绪存在感。", items: ["语音", "情绪分析", "主动关心"] },
      { version: "V0.3", timeframe: "90 天", goal: "从异步互动走向实时陪伴。", items: ["实时语音", "打断能力", "全双工对话"] }
    ] as const
  },
  statuses: {
    loadingProviderConfiguration: "正在加载供应商配置...",
    loadedSavedConfig: "已从 .waveary/provider-config.json 加载本地保存的供应商配置。",
    chooseProvider: "选择供应商并获取当前 API Key 可用的模型；已有本地会话仍然可用。",
    noPresets: "当前没有可用的供应商预设。",
    noModels: "这个 API Key 没有返回任何可用模型。",
    configSaved: "供应商配置已保存到本地。Waveary 现在可以使用这个模型。",
    sessionCreated: "已创建新的本地聊天会话。",
    sessionRenamed: "会话标题已更新。",
    sessionDeleted: "会话已删除。",
    mainSessionReset: "主陪伴会话已重置，本地历史与最近信号都已清空。",
    sessionReset: "会话已重置，本地历史与最近信号都已清空。",
    sampleLoaded: "已将 Waveary 示例会话包载入导入编辑器。"
  },
  formatting: {
    backend: { file: "文件 JSON", sqlite: "SQLite", unknown: "未知" },
    sync: { active: "使用中", "in-sync": "已同步", behind: "落后", ahead: "领先", diverged: "分叉" } as const,
    memoryType: {
      life_event: "人生事件",
      preference: "偏好",
      relationship: "关系",
      reflection: "反思",
      fact: "事实"
    } as const,
    runtimeNotConfigured: "尚未配置",
    localSessionsAvailable: (count: number) => `${count} 个本地会话可用`,
    noArchive: "还没有持久档案",
    archiveSummary: (memories: number, timeline: number) => `${memories} 条记忆，${timeline} 个时间轴事件`,
    ready: "可开始实时对话",
    waiting: "等待供应商配置",
    importance: "重要度",
    sep: " · "
  }
} as const;

const enCopy = {
  brandSubtitle: "Waveary",
  brandCaption: "Digital Life Companion Framework",
  slogan: "What is remembered returns as an echo.",
  nav: ["Home", "Intro", "Engines", "Structure", "Console", "Roadmap"] as const,
  hero: {
    eyebrow: "Project Waveary",
    chip: "Waveary CE",
    kicker: "Digital Life Companion Framework",
    title: ["What Is Remembered", "Returns As an Echo."] as const,
    lead:
      "Waveary is an open source framework that gives any model long-term memory, relationship growth, life timeline awareness, and the capacity to stay with a user over time.",
    support:
      "Waveary does not try to create a smarter chatbot. It builds the continuity layer that lets any model remember, relate, and grow across a user's life.",
    primary: "Read The Framework",
    secondary: "View Engine Stack"
  },
  principles: ["Memory comes before model.", "Relationship comes before features.", "Companionship comes before intelligence."] as const,
  introStatements: [
    "Waveary is designed as a long-term continuity layer for digital companionship.",
    "It gives any compatible model persistent memory, relationship state, and a life timeline.",
    "Its goal is not novelty per turn, but coherence across months, years, and personal history."
  ] as const,
  heroCards: {
    definitionLabel: "Project Definition",
    definitionTitle: "An operating layer for models that need memory, continuity, and companionship logic.",
    definitionBody:
      "Waveary should be understood less like an AI character app and more like a continuity framework that sits between model output and a user's life history.",
    positioningLabel: "Positioning",
    positioningTitle: "Framework first, companion second, vendor neutral by default.",
    positioningBody: "Not AI girlfriend branding. Not a generic chatbot shell. Not a one-provider product trap.",
    audienceLabel: "Who It Is For",
    audienceTitle: "Teams building persistent digital companionship on top of modern models.",
    audienceBody: "Use Waveary when continuity, memory, and relationship state matter more than novelty per turn."
  },
  intro: {
    caption: "Framework Introduction",
    title: "Waveary is the continuity layer between model output and a user's actual life.",
    description:
      "It is designed to give large models a stable memory substrate, a relationship system, a life timeline, and the basis for long-term digital companionship.",
    essay: [
      "Most AI products are evaluated by whether a single answer feels smart. Waveary is evaluated by whether the system can stay coherent over time, remember what matters, and let a relationship grow without collapsing every time the provider or session changes.",
      "That means memory is not a side feature, relationship is not prompt flavor, and personal history is not disposable log data. They are first-class system concerns."
    ] as const,
    panels: [
      {
        label: "Open Source Core",
        title: "A framework layer, not a themed chatbot wrapper.",
        description:
          "Waveary turns continuity into product infrastructure so memory, relationship, timeline, and emotional state can survive beyond one turn."
      },
      {
        label: "Model Agnostic",
        title: "Bring your own provider and keep the continuity layer stable.",
        description:
          "Provider setup, model discovery, and runtime orchestration stay separable, so the companion layer does not collapse into one vendor."
      },
      {
        label: "Companion Logic",
        title: "Remember, relate, and grow across a user's life.",
        description:
          "The system is designed to accumulate context, reflect relationship change, and organize life events into a durable personal history."
      }
    ] as const,
    thesisCaption: "Core Thesis",
    thesisTitle: "Memory comes before model. Relationship comes before features. Companionship comes before intelligence.",
    thesisBody:
      "The point is not to make a chatbot sound more dramatic. The point is to make a companion remain coherent over time, even as the model provider changes underneath it."
  },
  frameworkLayers: [
    { title: "Memory Continuity", description: "Turn conversation fragments into retrievable and persistent memory assets." },
    { title: "Relationship Continuity", description: "Model trust, familiarity, and stage progression as real runtime state." },
    { title: "Timeline Continuity", description: "Preserve important moments as a life sequence instead of disposable logs." },
    { title: "Emotional Continuity", description: "Track short-term feeling and long-term tone so companionship becomes more coherent." }
  ] as const,
  manifesto: {
    caption: "Framework Positioning",
    title: "Not a roleplay shell. A continuity system for digital life companionship.",
    description:
      "Waveary sits between the interface and the model provider. It gives any compatible model a persistent memory layer, a relationship state, a life timeline, and the groundwork for emotional and voice presence.",
    quote:
      "It does not try to create a smarter AI. It tries to create a partner that can remember, understand, grow, and stay with a user over time.",
    points: [
      {
        title: "Replace short-term prompt theater",
        description: "Move continuity into system architecture so memory and relationship do not disappear when the current turn ends."
      },
      {
        title: "Make provider switching survivable",
        description: "Keep setup, model discovery, and runtime invocation replaceable while the companion layer remains stable."
      },
      {
        title: "Treat personal history as product infrastructure",
        description: "Turn remembered facts, important moments, and relationship changes into a usable life archive."
      }
    ] as const
  },
  engines: {
    caption: "Core Engines",
    title: "A framework stack built for continuity, not short-term novelty.",
    description: "Each engine owns a stable continuity concern so the product shell stays expressive without stealing runtime responsibilities.",
    lens: "Architecture Lens",
    foundation:
      "The product is organized like a continuity operating layer: model access, memory, relationship state, archive persistence, and future voice all stay separable.",
    cards: [
      { acronym: "WME", name: "Waveary Memory Engine", summary: "Turn conversation into durable memory, not disposable context." },
      { acronym: "WRE", name: "Waveary Relationship Engine", summary: "Model relationship growth as state, signals, and long-term trust." },
      { acronym: "WTE", name: "Waveary Timeline Engine", summary: "Organize life events into recallable personal history." },
      { acronym: "WEE", name: "Waveary Emotion Engine", summary: "Track emotional state to guide tone, care, and continuity." },
      { acronym: "WVE", name: "Waveary Voice Engine", summary: "Prepare the path from text companionship to real-time voice." }
    ] as const
  },
  structure: {
    caption: "Project Structure",
    title: "A repository shape that keeps continuity logic separate from product surfaces.",
    description:
      "Waveary is being organized as a modular framework, so memory, runtime, interface, and future voice layers do not collapse into one app.",
    plan: "Repository Plan",
    modules: [
      { name: "waveary-core", role: "Runtime orchestration, provider abstraction, and continuity domain contracts." },
      { name: "waveary-web", role: "Official web surface for project framing, setup flow, and runtime access." },
      { name: "waveary-memory", role: "Memory extraction, storage, retrieval, and scoring behavior." },
      { name: "waveary-voice", role: "Future voice interaction layer for real-time and duplex companionship." }
    ] as const
  },
  console: {
    caption: "Companion Console",
    title: "The official interactive surface lives below the introduction, not inside it.",
    description:
      "The homepage explains the framework first. This section is where the current web reference surface starts to demonstrate setup, continuity, and runtime behavior.",
    summary: [
      ["Runtime Path", "Provider selection and model discovery stay in the local API layer, not in the client runtime."],
      ["Session Layer", "Main and optional sessions preserve continuity while keeping reset, rename, export, and import local."],
      ["Runtime State", "Live turns already return reply text plus memory, relationship, emotion, and timeline signals."],
      ["Persisted Archive", "Conversation history can survive process restarts and move across file or SQLite persistence."]
    ] as const,
    flow: [
      ["Surface 01", "Provider onboarding", "Pick a vendor, validate credentials, fetch models, and save one stable runtime path."],
      ["Surface 02", "Session continuity", "Session identity, persistence backend, import, export, reset, and archive all remain inspectable."],
      ["Surface 03", "Runtime observation", "Conversation, signals, and persisted archive are separated into a main canvas and inspection rail."]
    ] as const
  },
  setup: {
    caption: "Provider Setup",
    title: "Choose the vendor, inspect the models behind your key, and pin one usable runtime path.",
    description: "This browser-native configuration flow keeps provider logic server-side while the web layer owns the setup experience.",
    sequence: "Setup Sequence",
    interactive: "Interactive",
    steps: ["Choose provider", "Enter API key", "Fetch models", "Select model", "Save config", "Open chat next"] as const,
    savedConfiguration: "Saved Configuration",
    noSavedConfiguration: "No saved provider configuration yet. Complete the flow on the right to create one.",
    presetCoverage: "Preset Coverage",
    setupConsole: "Setup Console",
    localApi: "Local API",
    provider: "Provider",
    providerPlaceholder: "Select a provider",
    baseUrl: "Base URL",
    apiKey: "API Key",
    selectedPreset: "Selected Preset",
    selectedPresetFallback: "Pick a provider preset to start from a known compatible endpoint.",
    selectedPresetSuffix: "will use its OpenAI-compatible endpoint unless you override the base URL.",
    fetchModels: "Fetch Available Models",
    fetchingModels: "Fetching Models...",
    models: "Available Models",
    model: "Model",
    modelsHint: "Fetch models after entering a provider, base URL, and API key. The result list comes directly from the provider's `/models` endpoint.",
    saveConfig: "Save Provider Configuration",
    saving: "Saving..."
  },
  runtime: {
    caption: "Live Runtime",
    title: "Run the current Waveary browser flow with sessions, archive visibility, and continuity signals.",
    description: "This reference shell already returns a real reply plus memory recall, relationship change, and timeline output from the underlying runtime.",
    sessionLayer: "Session Layer",
    sessionTag: "Main + Optional Sessions",
    main: "Main",
    session: "Session",
    messages: "messages",
    persistence: "Persistence Backend",
    loading: "Loading...",
    currentStore: "Current local store:",
    loadingPersistence: "Loading current chat persistence backend.",
    lastSync: "Last Sync",
    noSwitch: "No switch recorded",
    noMigration: "The current backend is using its local state without a recorded migration event.",
    sessionsSynced: "sessions synchronized",
    localStoreMissing: "Local store file has not been created yet.",
    latest: "latest",
    noWrites: "no session writes yet",
    sessionsUnit: "sessions",
    activeBackendDescription: "This is the backend currently serving local chat reads and writes.",
    noSessionDiff: "No session differences detected against the active backend.",
    backend: "Backend",
    switchBackend: "Switch Backend",
    switching: "Switching...",
    createSession: "Create Session",
    newSessionTitle: "New Session Title",
    newSessionPlaceholder: "Late night reflection, product brainstorm, memory test...",
    importSession: "Import Session JSON",
    packageRules: "Package Rules",
    currentSchema: "Current schema version:",
    topLevelFields: "Top-Level Fields",
    requiredArrays: "Required Snapshot Arrays",
    importedSessionTitle: "Imported Session Title",
    importedSessionPlaceholder: "Recovered companion session...",
    exportedJson: "Exported JSON",
    exportedJsonPlaceholder: "Paste an exported session package here...",
    chooseJsonFile: "Choose JSON File",
    loadSample: "Load Sample Package",
    importAsNew: "Import As New Session",
    importing: "Importing...",
    importDiagnostics: "Import Diagnostics",
    manageSession: "Manage Active Session",
    mainSessionDescription: "Main companion session. Always preserved, but its local history can be reset.",
    optionalSessionDescription: "Optional local session. Can be renamed, reset, or removed.",
    sessionTitle: "Session Title",
    renamePlaceholder: "Rename this session",
    exportSession: "Export Session JSON",
    exporting: "Exporting...",
    resetSession: "Reset Session",
    renameSession: "Rename Session",
    deleteSession: "Delete Session",
    noLocalSession: "No local session is available yet.",
    canvas: "Conversation Canvas",
    runtimeReady: "Runtime Ready",
    setupRequired: "Setup Required",
    restored: "Restored local session history from",
    emptyChat: "Save a provider configuration, then send the first message to start a live Waveary session.",
    you: "You",
    assistant: "Waveary",
    placeholder: "Tell Waveary something worth remembering...",
    sending: "Sending...",
    send: "Send Message",
    quickPermissions: "Quick Permissions",
    quickPermissionsHint: "Adjust time, care, and local powers here without leaving the conversation.",
    sessionExport: "Session Export",
    structuredJson: "Structured JSON",
    exportDescription: "This export package includes conversation, persisted memories, relationship state, timeline events, and latest insights for the active session.",
    importSafety: "Import safety",
    currentSchemaShort: "Current schema:",
    proactiveCare: "Proactive Care",
    proactiveCareTag: "WPCE",
    proactiveCareDescription: "Review and save the active session's proactive-care policy, then run an immediate evaluation against the persisted state.",
    proactiveEnabled: "Enable proactive care",
    quietHoursStart: "Quiet hours start",
    quietHoursEnd: "Quiet hours end",
    maxDailyReachouts: "Max daily reachouts",
    allowMealCare: "Allow meal care",
    allowSleepCare: "Allow sleep care",
    allowAbsenceCheckins: "Allow absence check-ins",
    dailyReachoutsSent: "Reachouts sent today",
    unansweredReachoutCount: "Unanswered reachouts",
    lastReachOutAt: "Last reachout",
    noReachOutYet: "No proactive reachout has been recorded yet.",
    saveProactiveSettings: "Save care settings",
    savingProactiveSettings: "Saving...",
    evaluateProactiveNow: "Evaluate now",
    evaluatingProactive: "Evaluating...",
    proactiveSettingsSaved: "Saved proactive-care settings for the active session.",
    proactiveEvaluationReady: "Completed proactive-care evaluation for the active session.",
    proactiveDecision: "Evaluation Result",
    proactiveShouldReachOut: "Should reach out",
    proactiveIntent: "Intent",
    proactiveUrgency: "Urgency",
    proactiveTone: "Tone",
    proactiveReasons: "Reasons",
    proactiveSuggestedMessage: "Suggested message draft",
    proactiveSuggestedDelay: "Suggested delay",
    proactiveEvaluatedAt: "Evaluated at",
    proactiveNoDecision: "No proactive-care evaluation has been run yet.",
    browserNotifications: "Browser Notifications",
    notificationPermission: "Permission",
    notificationAutoDelivery: "Auto-notify when reachout is recommended",
    notificationHint: "This stays local to the current browser. Waveary only delivers a notification when the evaluation recommends a reachout and permission has been granted.",
    proactiveLocalLoop: "Local Check Loop",
    proactiveLocalLoopEnabled: "Periodically evaluate while this tab is visible",
    proactiveLocalLoopInterval: "Evaluation interval",
    proactiveLocalLoopHint: "This only runs while the current browser tab stays open and visible. It does not perform hidden background automation.",
    proactiveLocalLoopLastRun: "Last local check",
    proactiveLocalLoopOutcome: "Latest outcome",
    proactiveLocalLoopNever: "No local check has run yet.",
    proactiveAutoOutcomeNotified: "Delivered a notification",
    proactiveAutoOutcomeRecommended: "Recommended a reachout but did not deliver a notification",
    proactiveAutoOutcomeWait: "Waiting remains the better move",
    requestNotificationPermission: "Request Notification Permission",
    requestingNotificationPermission: "Requesting...",
    notificationDelivered: "Delivered a browser notification.",
    notificationNeedsPermission: "Notifications are enabled, but browser permission has not been granted yet.",
    notificationNoReachout: "This evaluation did not recommend a proactive reachout, so no notification was sent.",
    permissions: "Permission Center",
    permissionsTag: "Consent",
    permissionsDescription: "The user should explicitly decide what Waveary may see, remind, or eventually do. Higher-trust capabilities must be granted clearly and revocable at any time.",
    permissionsHint: "This currently manages the local frontend permission model. Capabilities not implemented yet stay as policy slots instead of being silently enabled.",
    permissionBrowserNotifications: "Browser notifications",
    permissionProactiveNotifications: "Proactive care notifications",
    permissionTimeAwareness: "Time awareness",
    permissionDesktopPresence: "Desktop presence awareness",
    permissionLocalActions: "Local action execution",
    permissionAllow: "Allow",
    permissionAsk: "Ask",
    permissionDeny: "Deny",
    permissionNotImplemented: "Not implemented yet. This only records your preference for now.",
    permissionSaved: "Saved local permission preferences.",
    yes: "Yes",
    no: "No",
    minutes: "minutes",
    signals: "Runtime Signals",
    signalsTag: "Memory + Relationship",
    relationshipStage: "Relationship Stage",
    affinity: "Affinity",
    trust: "Trust",
    stability: "Stability",
    emotion: "Detected Emotion",
    noEmotion: "No strong emotion signal detected for the latest turn.",
    recalledMemories: "Recalled Memories",
    noRecalled: "No recalled memories yet.",
    storedMemories: "Stored Memories",
    noStored: "No memory candidates were stored in the latest turn.",
    timeline: "Timeline",
    noTimeline: "No timeline events yet.",
    runtimeHint: "Send a message to see memory recall, relationship changes, and timeline events from the runtime.",
    archive: "Persisted Session Archive",
    archiveTag: "Memory + Timeline + Relationship",
    relationshipSnapshot: "Relationship Snapshot",
    noRelationshipSnapshot: "No persisted relationship snapshot yet.",
    memoryArchive: "Session Memory Archive",
    noPersistedMemories: "No persisted memories yet.",
    sessionTimeline: "Session Timeline",
    noPersistedTimeline: "No persisted timeline events yet.",
    archiveHint: "Send a message worth remembering. This area will show the session's persisted memory archive, relationship snapshot, and timeline after reloads."
  },
  roadmap: {
    caption: "Execution Roadmap",
    title: "Build the companion layer first. Expand the experience second.",
    phases: [
      { version: "V0.1", timeframe: "30 Days", goal: "Establish the first usable open source digital companion framework.", items: ["Chat", "Long-term memory", "Timeline", "Relationship growth"] },
      { version: "V0.2", timeframe: "60 Days", goal: "Expand the framework from continuity into emotional presence.", items: ["Voice", "Emotion analysis", "Proactive care"] },
      { version: "V0.3", timeframe: "90 Days", goal: "Move from asynchronous interaction to live companionship.", items: ["Real-time voice", "Interruptions", "Full duplex conversation"] }
    ] as const
  },
  statuses: {
    loadingProviderConfiguration: "Loading provider configuration...",
    loadedSavedConfig: "Loaded saved provider configuration from .waveary/provider-config.json.",
    chooseProvider: "Choose a provider and fetch the models available to your API key. Existing local sessions remain available.",
    noPresets: "No provider presets are available.",
    noModels: "No models were returned for this API key.",
    configSaved: "Provider configuration saved locally. Waveary is ready to use this model.",
    sessionCreated: "Created a new local chat session.",
    sessionRenamed: "Session title updated.",
    sessionDeleted: "Session deleted.",
    mainSessionReset: "Main companion session reset. Local history and latest signals were cleared.",
    sessionReset: "Session reset. Local history and latest signals were cleared.",
    sampleLoaded: "Loaded the Waveary sample session package into the import editor."
  },
  formatting: {
    backend: { file: "File JSON", sqlite: "SQLite", unknown: "Unknown" },
    sync: { active: "Active", "in-sync": "In Sync", behind: "Behind", ahead: "Ahead", diverged: "Diverged" } as const,
    memoryType: {
      life_event: "Life Event",
      preference: "Preference",
      relationship: "Relationship",
      reflection: "Reflection",
      fact: "Fact"
    } as const,
    runtimeNotConfigured: "Not configured yet",
    localSessionsAvailable: (count: number) => (count === 1 ? "1 local session available" : `${count} local sessions available`),
    noArchive: "No persisted archive yet",
    archiveSummary: (memories: number, timeline: number) => `${memories} memories, ${timeline} timeline events`,
    ready: "Ready for live turns",
    waiting: "Waiting for provider setup",
    importance: "importance",
    sep: " · "
  }
} as const;

function getCopy(locale: Locale): typeof zhCopy | typeof enCopy {
  return locale === "zh" ? zhCopy : enCopy;
}

const proactiveIntentLabels: Record<Locale, Record<ProactiveCareIntent, string>> = {
  zh: {
    check_in: "日常问候",
    meal_care: "用餐关怀",
    sleep_care: "作息关怀",
    stress_followup: "压力跟进",
    absence_reachout: "失联关心",
    milestone_recall: "重要时刻回想",
    gentle_reminder: "轻提醒",
    celebration: "庆祝陪伴",
    comfort: "安抚陪伴"
  },
  en: {
    check_in: "Daily check-in",
    meal_care: "Meal care",
    sleep_care: "Sleep care",
    stress_followup: "Stress follow-up",
    absence_reachout: "Absence check-in",
    milestone_recall: "Milestone recall",
    gentle_reminder: "Gentle reminder",
    celebration: "Celebration",
    comfort: "Comfort"
  }
};

const proactiveUrgencyLabels: Record<Locale, Record<ProactiveCareUrgency, string>> = {
  zh: {
    low: "低",
    medium: "中",
    high: "高"
  },
  en: {
    low: "Low",
    medium: "Medium",
    high: "High"
  }
};

const proactiveReasonLabels: Record<Locale, Record<string, string>> = {
  zh: {
    policy_disabled: "当前会话未启用主动关怀",
    daily_reachout_limit_reached: "已达到今日主动触达上限",
    awaiting_user_response: "正在等待用户回应上一次主动关怀",
    quiet_hours_active: "当前处于静默时段",
    relationship_not_ready: "当前关系阶段还不适合主动触达",
    companion_concern_detected: "陪伴侧检测到明显担忧",
    recent_user_sadness: "最近消息里出现了低落或压力信号",
    care_gap_elapsed: "距离上次互动已经过了一段关怀间隔",
    long_absence_gap: "用户已经较长时间没有出现",
    relationship_continuity_check: "需要做一次关系连续性确认",
    late_hour_window: "当前处于较晚时段",
    rest_rhythm_check: "适合做一次作息关怀",
    meal_window: "当前处于用餐时段",
    light_daily_care: "适合一次轻量日常关怀",
    no_trigger_met: "目前没有触发主动关怀条件"
  },
  en: {
    policy_disabled: "Proactive care is disabled for this session",
    daily_reachout_limit_reached: "The daily proactive reachout limit has been reached",
    awaiting_user_response: "Waveary is waiting for a reply to the last proactive reachout",
    quiet_hours_active: "The current time falls inside quiet hours",
    relationship_not_ready: "The current relationship stage is not ready for proactive outreach",
    companion_concern_detected: "The companion side detected elevated concern",
    recent_user_sadness: "Recent user messages included sadness or stress signals",
    care_gap_elapsed: "Enough time has passed since the last interaction gap for a care follow-up",
    long_absence_gap: "The user has been absent for a longer gap",
    relationship_continuity_check: "A relationship continuity check is appropriate",
    late_hour_window: "The current time falls in a late-hour window",
    rest_rhythm_check: "A rest-rhythm check is appropriate",
    meal_window: "The current time falls in a meal window",
    light_daily_care: "A light daily care reachout is appropriate",
    no_trigger_met: "No proactive-care trigger is currently met"
  }
};

function formatProactiveIntent(intent: ProactiveCareDecision["intent"], locale: Locale): string {
  if (!intent) {
    return "-";
  }

  return proactiveIntentLabels[locale][intent] ?? humanizeRuntimeCode(intent);
}

function formatProactiveUrgency(
  urgency: ProactiveCareDecision["urgency"],
  locale: Locale
): string {
  if (!urgency) {
    return "-";
  }

  return proactiveUrgencyLabels[locale][urgency] ?? humanizeRuntimeCode(urgency);
}

function formatProactiveReason(reason: string, locale: Locale): string {
  return proactiveReasonLabels[locale][reason] ?? humanizeRuntimeCode(reason);
}

function humanizeRuntimeCode(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function parsePageLocation(hash: string): PageLocation {
  const normalized = hash.replace(/^#/, "").trim();

  if (!normalized) {
    return { page: "home" };
  }

  const [rawPage, rawSection] = normalized.split("/", 2);
  const sectionId = rawSection?.trim() ? rawSection.trim() : undefined;
  const withSection = (page: AppPage): PageLocation => (sectionId ? { page, sectionId } : { page });

  switch (rawPage) {
    case "console":
      return withSection("console");
    case "chat":
      return withSection("chat");
    case "roadmap":
      return withSection("roadmap");
    case "framework":
      return withSection("home");
    case "home":
    default:
      return withSection("home");
  }
}

function formatPageLocation(page: AppPage, sectionId?: string): string {
  return `#${page}${sectionId ? `/${sectionId}` : ""}`;
}

interface HeroPortraitCard {
  src: string;
  alt: string;
  rotation: string;
  top: string;
  left: string;
  delay: string;
}

type ConsoleWorkspace = "provider" | "voice" | "sessions" | "care" | "runtime";

interface HomeDoodle {
  id: string;
  src: string;
  top: string;
  left: string;
  rotation: string;
  scale: number;
  delay: string;
}

const heroPortraitCards: HeroPortraitCard[] = [
  {
    src: "/images/portraits/portrait-01.png",
    alt: "Question-mark portrait card one",
    rotation: "-7deg",
    top: "8%",
    left: "4%",
    delay: "0s"
  },
  {
    src: "/images/portraits/portrait-02.png",
    alt: "Question-mark portrait card two",
    rotation: "6deg",
    top: "10%",
    left: "62%",
    delay: "-6s"
  },
  {
    src: "/images/portraits/portrait-03.png",
    alt: "Question-mark portrait card three",
    rotation: "-4deg",
    top: "38%",
    left: "18%",
    delay: "-11s"
  },
  {
    src: "/images/portraits/portrait-04.png",
    alt: "Question-mark portrait card four",
    rotation: "7deg",
    top: "41%",
    left: "57%",
    delay: "-15s"
  },
  {
    src: "/images/portraits/portrait-05.png",
    alt: "Question-mark portrait card five",
    rotation: "-9deg",
    top: "62%",
    left: "6%",
    delay: "-19s"
  },
  {
    src: "/images/portraits/portrait-06.png",
    alt: "Question-mark portrait card six",
    rotation: "5deg",
    top: "64%",
    left: "50%",
    delay: "-24s"
  },
  {
    src: "/images/portraits/portrait-07.png",
    alt: "Question-mark portrait card seven",
    rotation: "-6deg",
    top: "16%",
    left: "34%",
    delay: "-9s"
  },
  {
    src: "/images/portraits/portrait-08.png",
    alt: "Question-mark portrait card eight",
    rotation: "8deg",
    top: "60%",
    left: "74%",
    delay: "-21s"
  }
];

const homeDoodles: HomeDoodle[] = [
  { id: "doodle-ruler", src: "/images/doodles/ruler.png", top: "12%", left: "5%", rotation: "-9deg", scale: 0.98, delay: "-4s" },
  { id: "doodle-bow", src: "/images/doodles/bow.png", top: "10%", left: "72%", rotation: "8deg", scale: 0.9, delay: "-9s" },
  { id: "doodle-stamp", src: "/images/doodles/stamp.png", top: "16%", left: "30%", rotation: "-7deg", scale: 0.82, delay: "-11s" },
  { id: "doodle-eraser", src: "/images/doodles/eraser.png", top: "22%", left: "86%", rotation: "11deg", scale: 0.88, delay: "-12s" },
  { id: "doodle-envelope", src: "/images/doodles/envelope.png", top: "28%", left: "15%", rotation: "10deg", scale: 0.92, delay: "-6s" },
  { id: "doodle-pencil", src: "/images/doodles/pencil.png", top: "42%", left: "3%", rotation: "-22deg", scale: 1.02, delay: "-16s" },
  { id: "doodle-notebook", src: "/images/doodles/notebook.png", top: "34%", left: "80%", rotation: "6deg", scale: 0.95, delay: "-3s" },
  { id: "doodle-postcard", src: "/images/doodles/postcard.png", top: "48%", left: "83%", rotation: "-5deg", scale: 0.86, delay: "-13s" },
  { id: "doodle-ribbon", src: "/images/doodles/ribbon.png", top: "58%", left: "88%", rotation: "-13deg", scale: 0.9, delay: "-14s" },
  { id: "doodle-paperclip", src: "/images/doodles/paperclip.png", top: "69%", left: "8%", rotation: "12deg", scale: 0.9, delay: "-20s" },
  { id: "doodle-train-ticket", src: "/images/doodles/train-ticket.png", top: "71%", left: "58%", rotation: "7deg", scale: 0.88, delay: "-19s" },
  { id: "doodle-cassette", src: "/images/doodles/cassette.png", top: "74%", left: "75%", rotation: "-8deg", scale: 1.05, delay: "-24s" },
  { id: "doodle-star", src: "/images/doodles/paper-star.png", top: "82%", left: "21%", rotation: "-6deg", scale: 0.84, delay: "-7s" },
  { id: "doodle-butterfly", src: "/images/doodles/butterfly.png", top: "46%", left: "92%", rotation: "9deg", scale: 0.86, delay: "-18s" }
];

const consoleWorkspaceOrder: ConsoleWorkspace[] = ["provider", "voice", "sessions", "care", "runtime"];

const HERO_BURN_CYCLE_MS = 12000;
const PROACTIVE_AUTO_CHECK_STORAGE_KEY = "waveary-proactive-auto-check-enabled";
const PROACTIVE_AUTO_CHECK_INTERVAL_STORAGE_KEY = "waveary-proactive-auto-check-interval-minutes";
const DEFAULT_PROACTIVE_AUTO_CHECK_INTERVAL_MINUTES = 20;

export function App(): ReactElement {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return "zh";
    }

    const saved = window.localStorage.getItem("waveary-locale");
    return saved === "en" || saved === "zh" ? saved : "zh";
  });
  const copy = getCopy(locale);
  const [presets, setPresets] = useState<ProviderPreset[]>([]);
  const [savedConfig, setSavedConfig] = useState<SavedProviderConfig | null>(null);
  const [voiceConfig, setVoiceConfig] = useState<SavedVoiceConfig | null>(null);
  const [voicePresets, setVoicePresets] = useState<VoicePresetDescriptor[]>([]);
  const [voiceProviderPresets, setVoiceProviderPresets] = useState<VoiceProviderPreset[]>([]);
  const [voiceCatalog, setVoiceCatalog] = useState<VoiceCatalogResponse | null>(null);
  const [voiceRoutingStatus, setVoiceRoutingStatus] = useState<VoiceRoutingStatus | null>(null);
  const [voiceDraftInput, setVoiceDraftInput] = useState("");
  const [voiceSearchQuery, setVoiceSearchQuery] = useState("");
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [baseURL, setBaseURL] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<ModelDescriptor[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [modelsState, setModelsState] = useState<LoadState>("idle");
  const [saveState, setSaveState] = useState<LoadState>("idle");
  const [voiceConfigState, setVoiceConfigState] = useState<LoadState>("idle");
  const [voiceCatalogState, setVoiceCatalogState] = useState<LoadState>("idle");
  const [statusMessage, setStatusMessage] = useState<string>(zhCopy.statuses.loadingProviderConfiguration);
  const [chatInput, setChatInput] = useState("");
  const [chatState, setChatState] = useState<LoadState>("idle");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInsights, setChatInsights] = useState<ChatTurnResponse | null>(null);
  const [pendingLocalAction, setPendingLocalAction] = useState<PendingLocalAction | null>(null);
  const [chatRestoredAt, setChatRestoredAt] = useState<string | null>(null);
  const [sessionMemoryArchive, setSessionMemoryArchive] = useState<SessionMemoryArchiveItem[]>([]);
  const [sessionRelationship, setSessionRelationship] = useState<SessionRelationshipSnapshot | null>(null);
  const [sessionTimelineEvents, setSessionTimelineEvents] = useState<SessionTimelineEvent[]>([]);
  const [proactiveCarePolicy, setProactiveCarePolicy] = useState<ProactiveCarePolicy | null>(null);
  const [proactiveCareState, setProactiveCareState] = useState<ProactiveCareState | null>(null);
  const [proactiveDecision, setProactiveDecision] = useState<ProactiveCareDecision | null>(null);
  const [proactiveDraft, setProactiveDraft] = useState<ProactiveMessageDraft | null>(null);
  const [proactiveSaveState, setProactiveSaveState] = useState<LoadState>("idle");
  const [proactiveEvaluateState, setProactiveEvaluateState] = useState<LoadState>("idle");
  const [browserNotificationPermission, setBrowserNotificationPermission] =
    useState<BrowserNotificationPermissionState>(() => getBrowserNotificationPermission());
  const [proactiveNotificationEnabled, setProactiveNotificationEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const stored = window.localStorage.getItem("waveary-proactive-browser-notify");
    return stored === null ? true : stored === "true";
  });
  const [permissionProfile, setPermissionProfile] = useState<WavearyPermissionProfile>(() => {
    if (typeof window === "undefined") {
      return createDefaultPermissionProfile();
    }

    return loadPermissionProfile();
  });
  const [notificationPermissionState, setNotificationPermissionState] = useState<LoadState>("idle");
  const [proactiveAutoCheckEnabled, setProactiveAutoCheckEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }

    const stored = window.localStorage.getItem(PROACTIVE_AUTO_CHECK_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });
  const [proactiveAutoCheckIntervalMinutes, setProactiveAutoCheckIntervalMinutes] = useState<number>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_PROACTIVE_AUTO_CHECK_INTERVAL_MINUTES;
    }

    const raw = Number(window.localStorage.getItem(PROACTIVE_AUTO_CHECK_INTERVAL_STORAGE_KEY) ?? "");
    return Number.isFinite(raw) && raw >= 5 ? raw : DEFAULT_PROACTIVE_AUTO_CHECK_INTERVAL_MINUTES;
  });
  const [proactiveAutoCheckLastRunAt, setProactiveAutoCheckLastRunAt] = useState<string | null>(null);
  const [proactiveAutoCheckLastOutcome, setProactiveAutoCheckLastOutcome] =
    useState<ProactiveAutoCheckOutcome | null>(null);
  const [chatPermissionTrayOpen, setChatPermissionTrayOpen] = useState(false);
  const [localActionResolveState, setLocalActionResolveState] = useState<LoadState>("idle");
  const [voiceConversationMode, setVoiceConversationMode] = useState(false);
  const [voicePlaybackState, setVoicePlaybackState] = useState<VoicePlaybackState>("idle");
  const [voiceStatusMessage, setVoiceStatusMessage] = useState("");
  const [speechInputState, setSpeechInputState] = useState<SpeechInputState>(() =>
    getSpeechRecognitionConstructor() ? "idle" : "unsupported"
  );
  const [speechInputStatusMessage, setSpeechInputStatusMessage] = useState("");
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
  const [sessionImportErrors, setSessionImportErrors] = useState<string[]>([]);
  const [sessionPackageReference, setSessionPackageReference] = useState<SessionPackageReference | null>(null);
  const sessionImportFileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeBurnPortraitIndex, setActiveBurnPortraitIndex] = useState(1);
  const [activeConsoleWorkspace, setActiveConsoleWorkspace] = useState<ConsoleWorkspace>("provider");
  const [currentPage, setCurrentPage] = useState<AppPage>(() => {
    if (typeof window === "undefined") {
      return "home";
    }

    return parsePageLocation(window.location.hash).page;
  });
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const voicePickerRef = useRef<HTMLDivElement | null>(null);
  const speechRecognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<BrowserMediaRecorder | null>(null);
  const mediaRecorderStreamRef = useRef<MediaStream | null>(null);
  const speechAudioChunksRef = useRef<Blob[]>([]);
  const speechInputModeRef = useRef<"browser-recognition" | "provider-stt" | null>(null);
  const speechInputBaseRef = useRef("");
  const speechInputFinalRef = useRef("");
  const speechInputManualStopRef = useRef(false);
  const speechInputErrorRef = useRef(false);
  const voiceConversationModeRef = useRef(false);
  const voiceConversationResumeTimerRef = useRef<number | null>(null);
  const providerSpeechStopTimerRef = useRef<number | null>(null);
  const providerSpeechFrameRef = useRef<number | null>(null);
  const providerSpeechAudioContextRef = useRef<AudioContext | null>(null);
  const providerSpeechAnalyserRef = useRef<AnalyserNode | null>(null);
  const providerSpeechSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const providerSpeechHeardVoiceRef = useRef(false);
  const providerSpeechStartedAtRef = useRef<number>(0);
  const providerSpeechLastActiveAtRef = useRef<number>(0);

  useEffect(() => {
    voiceConversationModeRef.current = voiceConversationMode;
  }, [voiceConversationMode]);

  useEffect(() => {
    window.localStorage.setItem("waveary-locale", locale);
  }, [locale]);

  useEffect(() => {
    return () => {
      voiceConversationModeRef.current = false;
      clearVoiceConversationResumeTimer();

      const recognition = speechRecognitionRef.current;
      speechRecognitionRef.current = null;

      if (recognition) {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      }

      clearProviderSpeechStopTimer();
      stopProviderSpeechActivityMonitor();
      cleanupProviderSpeechCapture();

      stopVoicePlayback();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "waveary-proactive-browser-notify",
      proactiveNotificationEnabled ? "true" : "false"
    );
  }, [proactiveNotificationEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "waveary-permission-profile",
      JSON.stringify(permissionProfile)
    );
  }, [permissionProfile]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      PROACTIVE_AUTO_CHECK_STORAGE_KEY,
      proactiveAutoCheckEnabled ? "true" : "false"
    );
  }, [proactiveAutoCheckEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      PROACTIVE_AUTO_CHECK_INTERVAL_STORAGE_KEY,
      String(proactiveAutoCheckIntervalMinutes)
    );
  }, [proactiveAutoCheckIntervalMinutes]);

  useEffect(() => {
    void loadInitialState();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!proactiveAutoCheckEnabled || !activeSessionId || !savedConfig) {
      return;
    }

    if (permissionProfile.proactiveNotifications !== "allow") {
      return;
    }

    const runIfVisible = (): void => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (proactiveEvaluateState === "loading" || chatState === "loading") {
        return;
      }

      void runProactiveCareEvaluation({ source: "auto" }).catch((error: unknown) => {
        setStatusMessage(getErrorMessage(error));
      });
    };

    const intervalId = window.setInterval(
      runIfVisible,
      proactiveAutoCheckIntervalMinutes * 60 * 1000
    );

    const handleVisibilityChange = (): void => {
      runIfVisible();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    activeSessionId,
    chatState,
    permissionProfile.proactiveNotifications,
    proactiveAutoCheckEnabled,
    proactiveAutoCheckIntervalMinutes,
    proactiveEvaluateState,
    savedConfig
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveBurnPortraitIndex((currentIndex) => (currentIndex + 1) % heroPortraitCards.length);
    }, HERO_BURN_CYCLE_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const applyLocation = (location: PageLocation, behavior: ScrollBehavior): void => {
      setCurrentPage(location.page);

      window.requestAnimationFrame(() => {
        if (location.sectionId) {
          document.getElementById(location.sectionId)?.scrollIntoView({
            behavior,
            block: "start"
          });
          return;
        }

        window.scrollTo({
          top: 0,
          behavior
        });
      });
    };

    const handleHashChange = (): void => {
      applyLocation(parsePageLocation(window.location.hash), "auto");
    };

    if (!window.location.hash) {
      window.history.replaceState(null, "", "#home");
    }

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  function navigateTo(page: AppPage, sectionId?: string): void {
    if (typeof window === "undefined") {
      return;
    }

    const nextHash = formatPageLocation(page, sectionId);

    if (window.location.hash === nextHash) {
      if (sectionId) {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }

      setCurrentPage(page);
      return;
    }

    window.location.hash = nextHash;
  }

  async function loadInitialState(): Promise<void> {
    setLoadState("loading");
    setModelsState("idle");
    setSaveState("idle");
    setStatusMessage(copy.statuses.loadingProviderConfiguration);

    try {
      const voiceConfigPromise = fetchJson<VoiceConfigResponse>("/api/voice/config").catch((error) => {
        console.warn("Optional voice config init failed.", error);
        return null;
      });
      const voiceProviderPresetPromise = fetchJson<{ presets: VoiceProviderPreset[] }>("/api/voice/presets").catch(
        (error) => {
          console.warn("Optional voice presets init failed.", error);
          return null;
        }
      );
      const [presetResponse, configResponse, sessionFormatResponse, sessionsResponse, voiceConfigResponse, voiceProviderPresetResponse] = await Promise.all([
        fetchJson<{ presets: ProviderPreset[] }>("/api/provider/presets"),
        fetchJson<{ config?: SavedProviderConfig }>("/api/provider/config"),
        fetchJson<{ reference: SessionPackageReference }>("/api/chat/session/format"),
        fetchJson<{
          sessions: ChatSessionListItem[];
          defaultSessionId: string;
          persistence: ChatPersistenceStatus;
        }>("/api/chat/sessions"),
        voiceConfigPromise,
        voiceProviderPresetPromise
      ]);

      const nextConfig = configResponse.config ?? null;
      const nextPresets = presetResponse.presets;
      const fallbackPreset = nextPresets[0];
      const nextSessions = sessionsResponse.sessions;
      const nextDefaultSessionId = sessionsResponse.defaultSessionId;
      const nextActiveSessionId = nextSessions[0]?.sessionId ?? nextDefaultSessionId;

      setPresets(nextPresets);
      setModels([]);
      setSelectedModel("");
      setSavedConfig(nextConfig);
      if (voiceConfigResponse) {
        setVoiceConfig(voiceConfigResponse.config);
        setVoicePresets(voiceConfigResponse.presets);
        setVoiceRoutingStatus(voiceConfigResponse.routing);
      }
      if (voiceProviderPresetResponse) {
        setVoiceProviderPresets(voiceProviderPresetResponse.presets);
      }
      setSessionPackageReference(sessionFormatResponse.reference);
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
        setStatusMessage(copy.statuses.loadedSavedConfig);
      } else if (fallbackPreset) {
        setSelectedProvider(fallbackPreset.id);
        setBaseURL(fallbackPreset.baseURL);
        setApiKey("");
        setStatusMessage(copy.statuses.chooseProvider);
      } else {
        setSelectedProvider("");
        setBaseURL("");
        setApiKey("");
        setStatusMessage(copy.statuses.noPresets);
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
        body: JSON.stringify({ sessionId })
      });

      if (!response.session) {
        applySessionSnapshot(null);
        return;
      }

      applySessionSnapshot(response.session);
      setProactiveDecision(null);
      setProactiveDraft(null);
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  }

  function applySessionSnapshot(session: ChatSessionSnapshot | null): void {
    if (!session) {
      setChatMessages([]);
      setChatInsights(null);
      setPendingLocalAction(null);
      setChatRestoredAt(null);
      setSessionMemoryArchive([]);
      setSessionRelationship(null);
      setSessionTimelineEvents([]);
      setProactiveCarePolicy(null);
      setProactiveCareState(null);
      return;
    }

    setChatMessages(session.messages);
    setChatInsights(session.latestInsights);
    setPendingLocalAction(session.latestInsights?.pendingLocalAction ?? null);
    setChatRestoredAt(session.updatedAt);
    setSessionMemoryArchive(session.memoryArchive);
    setSessionRelationship(session.relationship);
    setSessionTimelineEvents(session.timelineEvents);
    setProactiveCarePolicy(session.proactiveCarePolicy);
    setProactiveCareState(session.proactiveCareState);
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
          ? locale === "zh"
            ? `已为 ${selectedProvider} 获取 ${response.models.length} 个模型。`
            : `Fetched ${response.models.length} models for ${selectedProvider}.`
          : copy.statuses.noModels
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
      setStatusMessage(copy.statuses.configSaved);
      await loadChatSession(activeSessionId || defaultSessionId);
    } catch (error) {
      setSaveState("error");
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function saveVoiceConfigPatch(
    patch: Partial<SavedVoiceConfig>,
    successMessage?: string
  ): Promise<void> {
    const currentVoiceConfig = voiceConfig ?? null;

    if (!currentVoiceConfig) {
      return;
    }

    setVoiceConfigState("loading");

    try {
      const response = await fetchJson<VoiceConfigResponse>("/api/voice/config", {
        method: "POST",
      body: JSON.stringify({
          model: patch.model ?? currentVoiceConfig.model,
          voice: patch.voice ?? currentVoiceConfig.voice,
          format: patch.format ?? currentVoiceConfig.format,
          qualityProfile: patch.qualityProfile ?? currentVoiceConfig.qualityProfile,
          sttModel: patch.sttModel ?? currentVoiceConfig.sttModel,
          providerMode: patch.providerMode ?? currentVoiceConfig.providerMode,
          provider: patch.provider ?? currentVoiceConfig.provider,
          baseURL: patch.baseURL ?? currentVoiceConfig.baseURL,
          apiKey: patch.apiKey ?? currentVoiceConfig.apiKey,
          appId: patch.appId ?? currentVoiceConfig.appId,
          accessKeyId: patch.accessKeyId ?? currentVoiceConfig.accessKeyId,
          secretAccessKey:
            patch.secretAccessKey ?? currentVoiceConfig.secretAccessKey,
          resourceId: patch.resourceId ?? currentVoiceConfig.resourceId,
          cluster: patch.cluster ?? currentVoiceConfig.cluster,
          endpointPath: patch.endpointPath ?? currentVoiceConfig.endpointPath,
          engine: patch.engine ?? currentVoiceConfig.engine,
          speaker: patch.speaker ?? currentVoiceConfig.speaker,
          referenceVoiceId: patch.referenceVoiceId ?? currentVoiceConfig.referenceVoiceId,
          textLanguage: patch.textLanguage ?? currentVoiceConfig.textLanguage,
          promptLanguage: patch.promptLanguage ?? currentVoiceConfig.promptLanguage,
          referenceTranscript:
            patch.referenceTranscript ?? currentVoiceConfig.referenceTranscript,
          stylePrompt: patch.stylePrompt ?? currentVoiceConfig.stylePrompt,
          styleStrength:
            patch.styleStrength !== undefined
              ? patch.styleStrength
              : currentVoiceConfig.styleStrength,
          temperature:
            patch.temperature !== undefined
              ? patch.temperature
              : currentVoiceConfig.temperature,
          topP: patch.topP !== undefined ? patch.topP : currentVoiceConfig.topP
        })
      });

      setVoiceConfig(response.config);
      setVoicePresets(response.presets);
      setVoiceRoutingStatus(response.routing);
      setVoiceConfigState("success");
      setVoiceStatusMessage(
        successMessage ??
          (locale === "zh" ? "语音设置已更新。" : "Voice settings updated.")
      );
    } catch (error) {
      setVoiceConfigState("error");
      setVoiceStatusMessage(getErrorMessage(error));
    }
  }

  async function handleVoiceProfileChange(nextProfile: string): Promise<void> {
    const preset = voicePresets.find((item) => item.id === nextProfile);
    const patch: Partial<SavedVoiceConfig> = { qualityProfile: nextProfile };

    if (preset?.model) {
      patch.model = preset.model;
    }

    if (preset?.voice) {
      patch.voice = preset.voice;
    }

    if (preset?.format) {
      patch.format = preset.format as SavedVoiceConfig["format"];
    }

    await saveVoiceConfigPatch(
      patch,
      locale === "zh" ? "语音风格已切换。" : "Voice profile switched."
    );
  }

  async function handleVoiceModelChange(nextModel: string): Promise<void> {
    await saveVoiceConfigPatch(
      { model: nextModel },
      locale === "zh" ? "语音模型已更新。" : "Voice model updated."
    );
  }

  async function handleVoiceNameChange(nextVoice: string): Promise<void> {
    await saveVoiceConfigPatch(
      { voice: nextVoice },
      locale === "zh" ? "声线已更新。" : "Voice name updated."
    );
  }

  async function handleSaveVoiceDraft(): Promise<void> {
    const nextVoice = voiceDraftInput.trim();

    if (!nextVoice) {
      setVoiceConfigState("error");
      setVoiceStatusMessage(
        locale === "zh" ? "请先输入或选择一个音色名称。" : "Enter or choose a voice name first."
      );
      return;
    }

    await handleVoiceNameChange(nextVoice);
  }

  async function handleVoiceProviderModeChange(nextMode: "shared" | "dedicated"): Promise<void> {
    if (nextMode === "shared") {
      setVoiceCatalog(null);
      setVoiceCatalogState("idle");
    }
    setVoicePickerOpen(false);
    setVoiceSearchQuery("");

    await saveVoiceConfigPatch(
      { providerMode: nextMode },
      nextMode === "dedicated"
        ? locale === "zh"
          ? "语音已切换到独立供应商模式。"
          : "Voice switched to dedicated provider mode."
        : locale === "zh"
          ? "语音已切换到共享聊天供应商模式。"
          : "Voice switched to shared chat-provider mode."
    );
  }

  async function handleVoiceProviderFieldChange(
    field:
      | "provider"
      | "baseURL"
      | "apiKey"
      | "appId"
      | "accessKeyId"
      | "secretAccessKey"
      | "resourceId"
      | "cluster"
      | "endpointPath"
      | "engine"
      | "speaker"
      | "referenceVoiceId"
      | "textLanguage"
      | "promptLanguage"
      | "referenceTranscript"
      | "stylePrompt",
    value: string
  ): Promise<void> {
    await saveVoiceConfigPatch(
      { [field]: value.trim() } as Partial<SavedVoiceConfig>,
      locale === "zh" ? "真人语音供应商设置已更新。" : "Voice provider settings updated."
    );
  }

  async function handleApplyVoiceProviderPreset(nextPresetId: string): Promise<void> {
    const preset = voiceProviderPresets.find((item) => item.id === nextPresetId);

    if (!preset) {
      return;
    }

    setVoiceCatalog(null);
    setVoiceCatalogState("idle");
    setVoicePickerOpen(false);
    setVoiceSearchQuery("");
    await saveVoiceConfigPatch(
      {
        providerMode: "dedicated",
        provider: preset.provider,
        baseURL: preset.baseURL,
        model: preset.defaultModel ?? "",
        voice: preset.defaultVoice ?? ""
      },
      locale === "zh" ? "已应用语音供应商预设。" : "Voice provider preset applied."
    );
  }

  async function handleFetchVoiceCatalog(): Promise<void> {
    if (!voiceConfig?.provider?.trim()) {
      setVoiceCatalogState("error");
      setVoiceStatusMessage(locale === "zh" ? "请先选择语音供应商。" : "Choose a voice provider first.");
      return;
    }

    const normalizedProvider = voiceConfig.provider.trim().toLowerCase();
    const requiresApiKey = normalizedProvider !== "local";
    const requiresBaseURL = normalizedProvider !== "doubao";
    const usesDoubaoCatalogKeys =
      normalizedProvider === "doubao" &&
      voiceConfig.accessKeyId.trim().length > 0 &&
      voiceConfig.secretAccessKey.trim().length > 0;

    if (requiresBaseURL && !voiceConfig.baseURL.trim()) {
      setVoiceCatalogState("error");
      setVoiceStatusMessage(locale === "zh" ? "请先填写语音 Base URL。" : "Enter the voice base URL first.");
      return;
    }

    if (requiresApiKey && !voiceConfig.apiKey.trim() && !usesDoubaoCatalogKeys) {
      setVoiceCatalogState("error");
      setVoiceStatusMessage(locale === "zh" ? "请先填写语音 API Key。" : "Enter the voice API key first.");
      return;
    }

    setVoiceCatalogState("loading");

    try {
      const response = await fetchJson<VoiceCatalogResponse>("/api/voice/catalog", {
        method: "POST",
        body: JSON.stringify({
          provider: selectedVoiceProviderPreset?.id ?? voiceConfig.provider,
          baseURL: voiceConfig.baseURL,
          apiKey: voiceConfig.apiKey,
          accessKeyId: voiceConfig.accessKeyId,
          secretAccessKey: voiceConfig.secretAccessKey
        })
      });

      setVoiceCatalog(response);
      setVoiceCatalogState("success");
      setVoiceStatusMessage(
        locale === "zh"
          ? `已加载语音目录：${response.models.length} 个模型，${response.voices.length} 个可选音色。`
          : `Loaded voice catalog: ${response.models.length} models and ${response.voices.length} voice options.`
      );

      const patch: Partial<SavedVoiceConfig> = {};
      const nextModel = response.models[0]?.id ?? response.defaultModel;
      const nextVoice = response.defaultVoice ?? response.voices[0]?.id;

      if (nextModel && nextModel !== voiceConfig.model) {
        patch.model = nextModel;
      }

      if (nextVoice && nextVoice !== voiceConfig.voice) {
        patch.voice = nextVoice;
      }

      if (Object.keys(patch).length > 0) {
        await saveVoiceConfigPatch(patch);
      }
    } catch (error) {
      setVoiceCatalog(null);
      setVoiceCatalogState("error");
      setVoiceStatusMessage(getErrorMessage(error));
    }
  }

  async function handleVoiceProviderNumberFieldChange(
    field: "styleStrength" | "temperature" | "topP",
    value: string
  ): Promise<void> {
    const trimmed = value.trim();
    const normalizedValue = trimmed.length === 0 ? null : Number(trimmed);

    if (normalizedValue !== null && !Number.isFinite(normalizedValue)) {
      setVoiceConfigState("error");
      setVoiceStatusMessage(
        locale === "zh"
          ? "请输入有效的语音参数数字。"
          : "Enter a valid numeric voice setting."
      );
      return;
    }

    await saveVoiceConfigPatch(
      { [field]: normalizedValue } as Partial<SavedVoiceConfig>,
      locale === "zh" ? "本地语音参数已更新。" : "Local voice tuning updated."
    );
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
      setSessionRenameTitle(response.sessions.find((session) => session.sessionId === response.session.sessionId)?.title ?? "");
      applySessionSnapshot(response.session);
      setProactiveDecision(null);
      setProactiveDraft(null);
      setNewSessionTitle("");
      setStatusMessage(copy.statuses.sessionCreated);
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
      setSessionRenameTitle(response.sessions.find((session) => session.sessionId === activeSessionId)?.title ?? sessionRenameTitle);
      setStatusMessage(copy.statuses.sessionRenamed);
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
      setSessionRenameTitle(response.sessions.find((session) => session.sessionId === fallbackSessionId)?.title ?? "");
      await loadChatSession(fallbackSessionId);
      setStatusMessage(copy.statuses.sessionDeleted);
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
      applySessionSnapshot(response.session);
      setProactiveDecision(null);
      setProactiveDraft(null);
      setSessionRenameTitle(response.sessions.find((session) => session.sessionId === activeSessionId)?.title ?? "");
      setStatusMessage(activeSessionId === defaultSessionId ? copy.statuses.mainSessionReset : copy.statuses.sessionReset);
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
      setSessionRenameTitle(response.sessions.find((session) => session.sessionId === nextActiveSessionId)?.title ?? "");
      await loadChatSession(nextActiveSessionId);
      setPersistenceState("success");
      setStatusMessage(
        response.importedSessionCount > 0
          ? locale === "zh"
            ? `已切换聊天持久化到 ${response.persistence.backend}，并导入了 ${response.importedSessionCount} 个已有会话。`
            : `Switched chat persistence to ${response.persistence.backend}. Imported ${response.importedSessionCount} existing sessions.`
          : locale === "zh"
            ? `已切换聊天持久化到 ${response.persistence.backend}。`
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
      setStatusMessage(locale === "zh" ? `已导出会话包：${response.exported.title}。` : `Exported session package for ${response.exported.title}.`);
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
      setSessionImportErrors([]);
      setStatusMessage(locale === "zh" ? `已载入导入文件：${file.name}` : `Loaded import file: ${file.name}`);
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
    setSessionImportErrors([]);

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
      applySessionSnapshot(response.imported.session);
      setProactiveDecision(null);
      setProactiveDraft(null);
      setSessionImportState("success");
      setSessionImportErrors([]);
      setStatusMessage(locale === "zh" ? `已导入为新会话：${response.imported.importedTitle}。` : `Imported session as ${response.imported.importedTitle}.`);
    } catch (error) {
      setSessionImportState("error");
      setSessionImportErrors(getErrorDetails(error));
      setStatusMessage(getErrorMessage(error));
    }
  }

  function handleLoadSampleSession(): void {
    if (!sessionPackageReference) {
      return;
    }

    setSessionImportJson(JSON.stringify(sessionPackageReference.sample, null, 2));
    setSessionImportErrors([]);
    setSessionImportTitle(locale === "zh" ? "恢复的示例会话" : "Recovered Sample Session");
    setStatusMessage(copy.statuses.sampleLoaded);
  }

  async function handleSaveProactiveCareSettings(): Promise<void> {
    if (!activeSessionId || !proactiveCarePolicy || !proactiveCareState) {
      return;
    }

    setProactiveSaveState("loading");

    try {
      const response = await fetchJson<{
        session: ChatSessionSnapshot;
        sessions: ChatSessionListItem[];
        defaultSessionId: string;
        persistence: ChatPersistenceStatus;
      }>("/api/chat/proactive/settings", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSessionId,
          policy: proactiveCarePolicy,
          state: proactiveCareState
        })
      });

      setChatSessions(response.sessions);
      setDefaultSessionId(response.defaultSessionId);
      setPersistenceStatus(response.persistence);
      setSelectedPersistenceBackend(response.persistence.backend);
      applySessionSnapshot(response.session);
      setProactiveSaveState("success");
      setStatusMessage(copy.runtime.proactiveSettingsSaved);
    } catch (error) {
      setProactiveSaveState("error");
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function runProactiveCareEvaluation(
    options: {
      source: "manual" | "auto";
    }
  ): Promise<ProactiveAutoCheckOutcome | null> {
    if (!activeSessionId) {
      return null;
    }

    try {
      const timeContext = buildChatTurnTimeContext(permissionProfile);
      const response = await fetchJson<ProactiveCareEvaluationResult>("/api/chat/proactive/evaluate", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSessionId,
          ...(timeContext ? { timeContext } : {})
        })
      });

      if (response.session) {
        applySessionSnapshot(response.session);
      }

      setProactiveDecision(response.decision);
      setProactiveDraft(response.draft);
      const nextOutcome: ProactiveAutoCheckOutcome = response.decision.shouldReachOut
        ? proactiveNotificationEnabled && browserNotificationPermission === "granted"
          ? "notified"
          : "recommended"
        : "wait";

      if (options.source === "auto") {
        setProactiveAutoCheckLastRunAt(response.decision.evaluatedAt);
        setProactiveAutoCheckLastOutcome(nextOutcome);
      }

      if (proactiveNotificationEnabled && response.decision.shouldReachOut) {
        if (browserNotificationPermission === "granted") {
          deliverProactiveBrowserNotification(
            response.decision,
            locale,
            permissionProfile,
            response.draft
          );
          await recordDeliveredProactiveReachout(response.decision);
          setStatusMessage(
            options.source === "auto"
              ? locale === "zh"
                ? "本地巡检已命中建议触达，并已发送浏览器通知。"
                : "The local check recommended outreach and delivered a browser notification."
              : copy.runtime.notificationDelivered
          );
        } else if (browserNotificationPermission === "default") {
          setStatusMessage(
            options.source === "auto"
              ? locale === "zh"
                ? "本地巡检命中了建议触达，但浏览器通知权限尚未授权。"
                : "The local check recommended outreach, but notification permission has not been granted."
              : copy.runtime.notificationNeedsPermission
          );
        } else {
          setStatusMessage(
            options.source === "auto"
              ? locale === "zh"
                ? "本地巡检命中了建议触达，但本轮没有投递通知。"
                : "The local check recommended outreach, but no notification was delivered in this pass."
              : copy.runtime.proactiveEvaluationReady
          );
        }
      } else {
        setStatusMessage(
          options.source === "auto"
            ? locale === "zh"
              ? "本地巡检已完成，当前继续等待更合适。"
              : "The local check completed and waiting remains the better move."
            : response.decision.shouldReachOut
              ? copy.runtime.proactiveEvaluationReady
              : copy.runtime.notificationNoReachout
        );
      }

      return nextOutcome;
    } catch (error) {
      if (options.source === "auto") {
        setProactiveAutoCheckLastRunAt(new Date().toISOString());
      }

      throw error;
    }
  }

  async function handleEvaluateProactiveCare(): Promise<void> {
    if (!activeSessionId) {
      return;
    }

    setProactiveEvaluateState("loading");

    try {
      await runProactiveCareEvaluation({ source: "manual" });
      setProactiveEvaluateState("success");
    } catch (error) {
      setProactiveEvaluateState("error");
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function recordDeliveredProactiveReachout(
    decision: ProactiveCareDecision
  ): Promise<void> {
    if (!activeSessionId || !proactiveCareState) {
      return;
    }

    const response = await fetchJson<{
      session: ChatSessionSnapshot;
      sessions: ChatSessionListItem[];
      defaultSessionId: string;
      persistence: ChatPersistenceStatus;
    }>("/api/chat/proactive/settings", {
      method: "POST",
      body: JSON.stringify({
        sessionId: activeSessionId,
        state: {
          dailyReachoutsSent: proactiveCareState.dailyReachoutsSent + 1,
          unansweredReachoutCount: Math.max(
            1,
            proactiveCareState.unansweredReachoutCount + 1
          ),
          lastReachOutAt: decision.evaluatedAt
        }
      })
    });

    setChatSessions(response.sessions);
    setDefaultSessionId(response.defaultSessionId);
    setPersistenceStatus(response.persistence);
    setSelectedPersistenceBackend(response.persistence.backend);
    applySessionSnapshot(response.session);
  }

  async function handleRequestNotificationPermission(): Promise<void> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setBrowserNotificationPermission("unsupported");
      return;
    }

    setNotificationPermissionState("loading");

    try {
      const permission = await window.Notification.requestPermission();
      setBrowserNotificationPermission(permission);
      setNotificationPermissionState("success");
      setStatusMessage(
        permission === "granted"
          ? copy.runtime.notificationDelivered
          : copy.runtime.notificationNeedsPermission
      );
    } catch (error) {
      setNotificationPermissionState("error");
      setStatusMessage(getErrorMessage(error));
    }
  }

  function handlePermissionLevelChange(
    key: keyof WavearyPermissionProfile,
    value: PermissionLevel
  ): void {
    setPermissionProfile((current) => ({
      ...current,
      [key]: value
    }));

    if (key === "proactiveNotifications") {
      setProactiveNotificationEnabled(value === "allow");
    }

    if (key === "browserNotifications" && value === "deny") {
      setProactiveNotificationEnabled(false);
    }

    setStatusMessage(copy.runtime.permissionSaved);
  }

  function handlePermissionPresetChange(mode: PermissionPresetMode): void {
    const nextProfile =
      mode === "full"
        ? createFullAccessPermissionProfile()
        : mode === "elevated"
          ? createElevatedPermissionProfile()
          : createLimitedPermissionProfile();

    setPermissionProfile(nextProfile);
    setProactiveNotificationEnabled(nextProfile.proactiveNotifications === "allow");
    setStatusMessage(
      locale === "zh"
        ? mode === "full"
          ? "已切换为完全访问模式。"
          : mode === "elevated"
            ? "已切换为高权限模式。"
            : "已切换为受限模式。"
        : mode === "full"
          ? "Switched to full-access mode."
          : mode === "elevated"
            ? "Switched to high-permission mode."
            : "Switched to limited mode."
    );
  }

  async function sendChatMessage(
    messageInput: string,
    options?: { fromSpeechInput?: boolean }
  ): Promise<void> {
    const trimmed = messageInput.trim();
    if (!trimmed) {
      return;
    }

    stopSpeechRecognition({ markManualStop: true });
    const timeContext = buildChatTurnTimeContext(permissionProfile);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed
    };

    setChatInput("");
    setChatState("loading");
    setChatMessages((current) => [...current, userMessage]);
    if (options?.fromSpeechInput) {
      setSpeechInputState("processing");
      setSpeechInputStatusMessage(
        locale === "zh" ? "正在发送语音消息…" : "Sending your voice message…"
      );
    }

    try {
      const response = await fetchJson<ChatTurnResponse>("/api/chat/turn", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSessionId || defaultSessionId,
          message: trimmed,
          localActionPermission: permissionProfile.localActions,
          locale,
          ...(timeContext ? { timeContext } : {})
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
      setPendingLocalAction(response.pendingLocalAction ?? null);
      setChatRestoredAt(new Date().toISOString());
      setChatSessions(sessionsResponse.sessions);
      setDefaultSessionId(sessionsResponse.defaultSessionId);
      setPersistenceStatus(sessionsResponse.persistence);
      setSelectedPersistenceBackend(sessionsResponse.persistence.backend);
      if (sessionSnapshotResponse.session) {
        applySessionSnapshot(sessionSnapshotResponse.session);
      }
      setProactiveDecision(null);
      setProactiveDraft(null);
      setChatState("success");
      if (options?.fromSpeechInput) {
        setSpeechInputState("idle");
        setSpeechInputStatusMessage(
          locale === "zh" ? "语音消息已发出。" : "Your voice message was sent."
        );
      }
      if (voiceConversationModeRef.current) {
        void speakAssistantReply(response.reply, response).catch(() => {
          // Keep chat flow successful even if voice playback fails.
        });
      }
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
      if (options?.fromSpeechInput) {
        setSpeechInputState("error");
        setSpeechInputStatusMessage(
          locale === "zh" ? "语音消息发送失败了。" : "Sending the voice message failed."
        );
      }
    }
  }

  async function handleSendMessage(): Promise<void> {
    await sendChatMessage(chatInput);
  }

  async function speakAssistantReply(
    text: string,
    insights?: ChatTurnResponse
  ): Promise<void> {
    clearVoiceConversationResumeTimer();
    stopVoicePlayback();
    setVoicePlaybackState("planning");
    setVoiceStatusMessage(locale === "zh" ? "正在准备语音…" : "Preparing voice…");

    try {
      const planResponse = await fetchJson<VoiceSpeakPlanResponse>("/api/voice/speak", {
        method: "POST",
        body: JSON.stringify({
          text,
          locale,
          relationship: insights?.relationship ?? sessionRelationship,
          emotion: insights?.emotion,
          delivery: insights?.delivery,
          persona: {
            tone: locale === "zh" ? "warm_companion" : "warm_companion",
            ...(insights?.delivery?.voiceStyle
              ? { voiceStyle: insights.delivery.voiceStyle }
              : {})
          },
          ...(voiceConfig ? { voiceConfig } : {})
        })
      });

      setVoiceRoutingStatus(planResponse.routing);

      if (planResponse.mode === "audio" && planResponse.audio) {
        await playProviderAudio(planResponse);
        return;
      }

      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window) ||
        !planResponse.plan
      ) {
        setVoicePlaybackState("error");
        setVoiceStatusMessage(
          locale === "zh"
            ? "当前浏览器不支持语音朗读。"
            : "This browser does not support speech synthesis."
        );
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const plan = planResponse.plan;
      utterance.lang = plan.lang;
      utterance.rate = plan.rate;
      utterance.pitch = plan.pitch;
      utterance.volume = plan.volume;

      const availableVoices = window.speechSynthesis.getVoices();
      const matchedVoice = pickSpeechVoice(availableVoices, plan);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        setVoicePlaybackState("speaking");
        setVoiceStatusMessage(
          locale === "zh"
            ? `当前使用浏览器兜底朗读，语气：${localizeVoiceStyle(plan.styleLabel, locale)}`
            : `Using browser fallback speech in a ${localizeVoiceStyle(plan.styleLabel, locale)} tone.`
        );
      };
      utterance.onend = () => {
        activeUtteranceRef.current = null;
        setVoicePlaybackState("idle");
        setVoiceStatusMessage(
          voiceConversationModeRef.current
            ? locale === "zh"
              ? "我说完了，继续听你。"
              : "I have finished speaking. I am listening again."
            : locale === "zh"
              ? "朗读完成。"
              : "Finished speaking."
        );
        if (voiceConversationModeRef.current) {
          scheduleVoiceConversationResume("reply-finished");
        }
      };
      utterance.onerror = () => {
        activeUtteranceRef.current = null;
        setVoicePlaybackState("error");
        setVoiceStatusMessage(
          locale === "zh" ? "语音朗读失败了。" : "Speech playback failed."
        );
        if (voiceConversationModeRef.current) {
          scheduleVoiceConversationResume("reply-finished");
        }
      };

      activeUtteranceRef.current = utterance;
      window.setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, plan.preDelayMs);
    } catch (error) {
      setVoicePlaybackState("error");
      setVoiceStatusMessage(getErrorMessage(error));
    }
  }

  async function startVoiceConversation(): Promise<void> {
    const supportsBrowserRecognition = Boolean(getSpeechRecognitionConstructor());
    const supportsProviderStt = canUseProviderSpeechToText(voiceConfig, voiceRoutingStatus);

    if (!supportsBrowserRecognition && !supportsProviderStt) {
      setVoiceConversationMode(false);
      setSpeechInputState("unsupported");
      setSpeechInputStatusMessage(
        locale === "zh"
          ? "\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u5b9e\u65f6\u8bed\u97f3\u5bf9\u8bdd\u3002"
          : "This browser does not support live voice conversation."
      );
      return;
    }

    clearVoiceConversationResumeTimer();
    setVoiceConversationMode(true);
    voiceConversationModeRef.current = true;
    setVoiceStatusMessage(
      locale === "zh"
        ? "\u5b9e\u65f6\u5bf9\u8bdd\u5df2\u5f00\u542f\uff0c\u6211\u4f1a\u542c\u5b8c\u4f60\u7684\u8bdd\u5c31\u56de\u5e94\u3002"
        : "Live conversation is on. I will listen, reply, and keep the flow going."
    );
    setSpeechInputStatusMessage(
      locale === "zh"
        ? "\u5b9e\u65f6\u5bf9\u8bdd\u5df2\u5f00\u542f\uff0c\u4f60\u8bf4\u5b8c\u4e00\u53e5\u6211\u5c31\u4f1a\u63a5\u4e0a\u3002"
        : "Live conversation is on. Finish one thought and I will answer right away."
    );
    await startSpeechInput({ fromVoiceConversation: true });
  }

  function stopVoiceConversation(): void {
    clearVoiceConversationResumeTimer();
    setVoiceConversationMode(false);
    voiceConversationModeRef.current = false;
    stopSpeechRecognition({ markManualStop: true });
    requestStopProviderSpeechCapture({ markManualStop: true, finalize: false });
    stopVoicePlayback();
    setVoicePlaybackState("idle");
    setVoiceStatusMessage(
      locale === "zh" ? "\u5b9e\u65f6\u5bf9\u8bdd\u5df2\u7ed3\u675f\u3002" : "Live conversation ended."
    );
    setSpeechInputState(getSpeechRecognitionConstructor() ? "idle" : "unsupported");
    setSpeechInputStatusMessage(
      locale === "zh"
        ? "\u5df2\u7ed3\u675f\u5b9e\u65f6\u8bed\u97f3\u5bf9\u8bdd\u3002"
        : "Live voice conversation ended."
    );
  }

  function clearVoiceConversationResumeTimer(): void {
    if (typeof window === "undefined" || voiceConversationResumeTimerRef.current === null) {
      return;
    }

    window.clearTimeout(voiceConversationResumeTimerRef.current);
    voiceConversationResumeTimerRef.current = null;
  }

  function scheduleVoiceConversationResume(reason: VoiceConversationResumeReason): void {
    if (typeof window === "undefined" || !voiceConversationModeRef.current) {
      return;
    }

    clearVoiceConversationResumeTimer();
    const delayMs = reason === "retry-listening" ? 420 : 220;

    voiceConversationResumeTimerRef.current = window.setTimeout(() => {
      voiceConversationResumeTimerRef.current = null;

      if (!voiceConversationModeRef.current) {
        return;
      }

      void startSpeechInput({ fromVoiceConversation: true });
    }, delayMs);
  }

  function handleToggleSpeechInput(): void {
    if (voiceConversationMode) {
      stopVoiceConversation();
      return;
    }

    if (speechInputState === "listening") {
      stopSpeechRecognition({ markManualStop: true });
      requestStopProviderSpeechCapture({ markManualStop: true, finalize: false });
      setSpeechInputState("idle");
      setSpeechInputStatusMessage(
        locale === "zh"
          ? "已停止听写，你可以检查文字后发送。"
          : "Listening stopped. Review the draft and send when ready."
      );
      return;
    }

    void startVoiceConversation();
  }

  async function startSpeechInput(options?: { fromVoiceConversation?: boolean }): Promise<void> {
    const supportsProviderStt = canUseProviderSpeechToText(voiceConfig, voiceRoutingStatus);
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (supportsProviderStt) {
      await startProviderSpeechInput(options);
      return;
    }

    if (!SpeechRecognition) {
      setSpeechInputState("unsupported");
      setSpeechInputStatusMessage(
        locale === "zh"
          ? "当前浏览器不支持语音输入。"
          : "This browser does not support speech input."
      );
      return;
    }

    if (!chatReady || chatState === "loading" || speechInputState === "processing") {
      return;
    }

    clearVoiceConversationResumeTimer();
    stopVoicePlayback();
    stopSpeechRecognition({ markManualStop: true });
    speechInputModeRef.current = "browser-recognition";

    const recognition = new SpeechRecognition();
    speechRecognitionRef.current = recognition;
    speechInputBaseRef.current = chatInput.trim();
    speechInputFinalRef.current = "";
    speechInputManualStopRef.current = false;
    speechInputErrorRef.current = false;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = locale === "zh" ? "zh-CN" : "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setSpeechInputState("listening");
      setSpeechInputStatusMessage(
        options?.fromVoiceConversation
          ? locale === "zh"
            ? "我在听，你慢慢说，说完我就接你。"
            : "I am listening. Take your time and I will answer as soon as you finish."
          : locale === "zh"
            ? "正在听你说话…说完后我会直接发出去。"
            : "Listening… I will send it as soon as you finish."
      );
    };

    recognition.onresult = (event) => {
      let nextFinal = speechInputFinalRef.current;
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result) {
          continue;
        }
        const transcript = result[0]?.transcript?.trim();

        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          nextFinal = `${nextFinal} ${transcript}`.trim();
        } else {
          interimTranscript = transcript;
        }
      }

      speechInputFinalRef.current = nextFinal;
      setChatInput(
        composeSpeechDraft(
          speechInputBaseRef.current,
          speechInputFinalRef.current,
          interimTranscript
        )
      );
    };

    recognition.onerror = (event) => {
      speechRecognitionRef.current = null;

      if (voiceConversationModeRef.current && event.error === "no-speech") {
        speechInputErrorRef.current = false;
        setSpeechInputState("idle");
        setSpeechInputStatusMessage(
          locale === "zh"
            ? "刚刚没听清，我继续听着你。"
            : "I did not quite catch that. I will keep listening."
        );
        return;
      }

      speechInputErrorRef.current = true;
      setSpeechInputState("error");
      setSpeechInputStatusMessage(localizeSpeechInputError(event.error, locale));
    };

    recognition.onend = () => {
      if (speechRecognitionRef.current === recognition) {
        speechRecognitionRef.current = null;
      }

      if (speechInputErrorRef.current) {
        return;
      }

      const recognizedDraft = composeSpeechDraft(
        speechInputBaseRef.current,
        speechInputFinalRef.current
      );

      if (speechInputManualStopRef.current) {
        setSpeechInputState("idle");
        setSpeechInputStatusMessage(
          recognizedDraft
            ? locale === "zh"
              ? "听写已停止，你可以修改后发送。"
              : "Listening stopped. You can edit the draft before sending."
            : locale === "zh"
              ? "已停止语音输入。"
              : "Speech input stopped."
        );
        return;
      }

      if (!recognizedDraft) {
        setSpeechInputState("idle");
        setSpeechInputStatusMessage(
          voiceConversationModeRef.current
            ? locale === "zh"
              ? "这次没听清，我再听你一次。"
              : "I did not catch that. I will listen again."
            : locale === "zh"
              ? "这次没有听清，我们再试一次。"
              : "I did not catch that. Try again."
        );
        if (voiceConversationModeRef.current) {
          scheduleVoiceConversationResume("retry-listening");
        }
        return;
      }

      setSpeechInputState("processing");
      setSpeechInputStatusMessage(
        voiceConversationModeRef.current
          ? locale === "zh"
            ? "听到了，我这就回你。"
            : "I heard you. Let me answer you now."
          : locale === "zh"
            ? "听到了，正在替你发出去…"
            : "Got it. Sending it now…"
      );
      void sendChatMessage(recognizedDraft, { fromSpeechInput: true });
    };

    try {
      recognition.start();
    } catch (error) {
      speechRecognitionRef.current = null;
      speechInputModeRef.current = null;
      setSpeechInputState("error");
      setSpeechInputStatusMessage(getErrorMessage(error));
    }
  }

  async function startProviderSpeechInput(options?: {
    fromVoiceConversation?: boolean;
  }): Promise<void> {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      if (getSpeechRecognitionConstructor()) {
        await startSpeechRecognitionFallback(options);
        return;
      }

      setSpeechInputState("unsupported");
      setSpeechInputStatusMessage(
        locale === "zh"
          ? "当前环境不支持麦克风采集。"
          : "This environment does not support microphone capture."
      );
      return;
    }

    if (!chatReady || chatState === "loading" || speechInputState === "processing") {
      return;
    }

    clearVoiceConversationResumeTimer();
    stopVoicePlayback();
    stopSpeechRecognition({ markManualStop: true });
    clearProviderSpeechStopTimer();
    stopProviderSpeechActivityMonitor();
    cleanupProviderSpeechCapture();

    speechInputBaseRef.current = chatInput.trim();
    speechInputFinalRef.current = "";
    speechInputManualStopRef.current = false;
    speechInputErrorRef.current = false;
    speechAudioChunksRef.current = [];
    speechInputModeRef.current = "provider-stt";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const MediaRecorderCtor = getMediaRecorderConstructor();
      const mimeType = pickSupportedRecorderMimeType(MediaRecorderCtor);
      const recorder = mimeType
        ? new MediaRecorderCtor(stream, { mimeType })
        : new MediaRecorderCtor(stream);

      mediaRecorderRef.current = recorder;
      mediaRecorderStreamRef.current = stream;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          speechAudioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = async () => {
        clearProviderSpeechStopTimer();
        stopProviderSpeechActivityMonitor();
        cleanupProviderSpeechCapture();

        if (getSpeechRecognitionConstructor()) {
          await startSpeechRecognitionFallback(options);
          return;
        }

        speechInputErrorRef.current = true;
        setSpeechInputState("error");
        setSpeechInputStatusMessage(
          locale === "zh"
            ? "语音采集失败了。"
            : "Speech capture failed."
        );
      };

      recorder.onstop = () => {
        void finalizeProviderSpeechInput(options);
      };

      setSpeechInputState("listening");
      setSpeechInputStatusMessage(
        options?.fromVoiceConversation
          ? locale === "zh"
            ? "我在听，你慢慢说，说完我就接你。"
            : "I am listening. Take your time and I will answer as soon as you finish."
          : locale === "zh"
            ? "正在听你说话…说完后我会直接发出去。"
            : "Listening... I will send it as soon as you finish."
      );

      recorder.start();
      startProviderSpeechActivityMonitor(stream);
    } catch (error) {
      clearProviderSpeechStopTimer();
      stopProviderSpeechActivityMonitor();
      cleanupProviderSpeechCapture();

      if (getSpeechRecognitionConstructor()) {
        await startSpeechRecognitionFallback(options);
        return;
      }

      speechInputModeRef.current = null;
      setSpeechInputState("error");
      setSpeechInputStatusMessage(getErrorMessage(error));
    }
  }

  async function startSpeechRecognitionFallback(options?: {
    fromVoiceConversation?: boolean;
  }): Promise<void> {
    speechInputModeRef.current = null;
    await startSpeechInputWithBrowserRecognition(options);
  }

  async function startSpeechInputWithBrowserRecognition(options?: {
    fromVoiceConversation?: boolean;
  }): Promise<void> {
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setSpeechInputState("unsupported");
      setSpeechInputStatusMessage(
        locale === "zh"
          ? "当前浏览器不支持语音输入。"
          : "This browser does not support speech input."
      );
      return;
    }

    clearVoiceConversationResumeTimer();
    stopVoicePlayback();
    stopSpeechRecognition({ markManualStop: true });
    speechInputModeRef.current = "browser-recognition";

    const recognition = new SpeechRecognition();
    speechRecognitionRef.current = recognition;
    speechInputBaseRef.current = chatInput.trim();
    speechInputFinalRef.current = "";
    speechInputManualStopRef.current = false;
    speechInputErrorRef.current = false;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = locale === "zh" ? "zh-CN" : "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setSpeechInputState("listening");
      setSpeechInputStatusMessage(
        options?.fromVoiceConversation
          ? locale === "zh"
            ? "我在听，你慢慢说，说完我就接你。"
            : "I am listening. Take your time and I will answer as soon as you finish."
          : locale === "zh"
            ? "正在听你说话…说完后我会直接发出去。"
            : "Listening... I will send it as soon as you finish."
      );
    };

    recognition.onresult = (event) => {
      let nextFinal = speechInputFinalRef.current;
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result) {
          continue;
        }
        const transcript = result[0]?.transcript?.trim();

        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          nextFinal = `${nextFinal} ${transcript}`.trim();
        } else {
          interimTranscript = transcript;
        }
      }

      speechInputFinalRef.current = nextFinal;
      setChatInput(
        composeSpeechDraft(
          speechInputBaseRef.current,
          speechInputFinalRef.current,
          interimTranscript
        )
      );
    };

    recognition.onerror = (event) => {
      speechRecognitionRef.current = null;
      speechInputModeRef.current = null;

      if (voiceConversationModeRef.current && event.error === "no-speech") {
        speechInputErrorRef.current = false;
        setSpeechInputState("idle");
        setSpeechInputStatusMessage(
          locale === "zh"
            ? "刚刚没听清，我继续听着你。"
            : "I did not quite catch that. I will keep listening."
        );
        return;
      }

      speechInputErrorRef.current = true;
      setSpeechInputState("error");
      setSpeechInputStatusMessage(localizeSpeechInputError(event.error, locale));
    };

    recognition.onend = () => {
      if (speechRecognitionRef.current === recognition) {
        speechRecognitionRef.current = null;
      }

      if (speechInputErrorRef.current) {
        return;
      }

      const recognizedDraft = composeSpeechDraft(
        speechInputBaseRef.current,
        speechInputFinalRef.current
      );

      if (speechInputManualStopRef.current) {
        setSpeechInputState("idle");
        setSpeechInputStatusMessage(
          recognizedDraft
            ? locale === "zh"
              ? "听写已停止，你可以修改后发送。"
              : "Listening stopped. You can edit the draft before sending."
            : locale === "zh"
              ? "已停止语音输入。"
              : "Speech input stopped."
        );
        return;
      }

      if (!recognizedDraft) {
        setSpeechInputState("idle");
        setSpeechInputStatusMessage(
          voiceConversationModeRef.current
            ? locale === "zh"
              ? "这次没听清，我再听你一次。"
              : "I did not catch that. I will listen again."
            : locale === "zh"
              ? "这次没有听清，我们再试一次。"
              : "I did not catch that. Try again."
        );
        if (voiceConversationModeRef.current) {
          scheduleVoiceConversationResume("retry-listening");
        }
        return;
      }

      setSpeechInputState("processing");
      setSpeechInputStatusMessage(
        voiceConversationModeRef.current
          ? locale === "zh"
            ? "听到了，我这就回你。"
            : "I heard you. Let me answer you now."
          : locale === "zh"
            ? "听到了，正在替你发出去…"
            : "Got it. Sending it now..."
      );
      void sendChatMessage(recognizedDraft, { fromSpeechInput: true });
    };

    try {
      recognition.start();
    } catch (error) {
      speechRecognitionRef.current = null;
      speechInputModeRef.current = null;
      setSpeechInputState("error");
      setSpeechInputStatusMessage(getErrorMessage(error));
    }
  }

  async function finalizeProviderSpeechInput(options?: {
    fromVoiceConversation?: boolean;
  }): Promise<void> {
    const recordedChunks = [...speechAudioChunksRef.current];
    const recorder = mediaRecorderRef.current;
    const mimeType = recorder?.mimeType || recordedChunks[0]?.type || "audio/webm";

    clearProviderSpeechStopTimer();
    stopProviderSpeechActivityMonitor();
    cleanupProviderSpeechCapture();

    if (speechInputManualStopRef.current) {
      setSpeechInputState("idle");
      setSpeechInputStatusMessage(
        locale === "zh"
          ? "已停止语音输入。"
          : "Speech input stopped."
      );
      return;
    }

    if (recordedChunks.length === 0) {
      setSpeechInputState("idle");
      setSpeechInputStatusMessage(
        voiceConversationModeRef.current
          ? locale === "zh"
            ? "这次没听清，我再听你一次。"
            : "I did not catch that. I will listen again."
          : locale === "zh"
            ? "这次没有听清，我们再试一次。"
            : "I did not catch that. Try again."
      );
      if (voiceConversationModeRef.current) {
        scheduleVoiceConversationResume("retry-listening");
      }
      return;
    }

    setSpeechInputState("processing");
    setSpeechInputStatusMessage(
      voiceConversationModeRef.current
        ? locale === "zh"
          ? "我在整理你刚刚的话。"
          : "I am transcribing what you just said."
        : locale === "zh"
          ? "正在转写你的语音…"
          : "Transcribing your voice..."
    );

    try {
      const blob = new Blob(recordedChunks, { type: mimeType });
      const base64 = await blobToBase64(blob);
      const response = await fetchJson<VoiceTranscribeResponse>("/api/voice/transcribe", {
        method: "POST",
        body: JSON.stringify({
          locale,
          prompt: "Companion live conversation.",
          audio: {
            base64,
            mimeType,
            fileName: buildSpeechAudioFileName(mimeType)
          },
          ...(voiceConfig ? { voiceConfig } : {})
        })
      });

      const recognizedDraft = composeSpeechDraft(
        speechInputBaseRef.current,
        response.text
      );

      if (!recognizedDraft.trim()) {
        setSpeechInputState("idle");
        setSpeechInputStatusMessage(
          voiceConversationModeRef.current
            ? locale === "zh"
              ? "这次没听清，我再听你一次。"
              : "I did not catch that. I will listen again."
            : locale === "zh"
              ? "这次没有听清，我们再试一次。"
              : "I did not catch that. Try again."
        );
        if (voiceConversationModeRef.current) {
          scheduleVoiceConversationResume("retry-listening");
        }
        return;
      }

      setVoiceRoutingStatus(response.routing);
      setChatInput(recognizedDraft);
      setSpeechInputStatusMessage(
        voiceConversationModeRef.current
          ? locale === "zh"
            ? "听到了，我这就回你。"
            : "I heard you. Let me answer you now."
          : locale === "zh"
            ? "听到了，正在替你发出去…"
            : "Got it. Sending it now..."
      );
      void sendChatMessage(recognizedDraft, { fromSpeechInput: true });
    } catch (error) {
      if (getSpeechRecognitionConstructor()) {
        setSpeechInputStatusMessage(
          locale === "zh"
            ? "当前转写线路没接通，我先切回浏览器听写。"
            : "Provider transcription is unavailable right now. Falling back to browser recognition."
        );
        await startSpeechRecognitionFallback(options);
        return;
      }

      setSpeechInputState("error");
      setSpeechInputStatusMessage(getErrorMessage(error));
    } finally {
      speechInputModeRef.current = null;
    }
  }

  async function playProviderAudio(planResponse: VoiceSpeakPlanResponse): Promise<void> {
    if (typeof window === "undefined" || !planResponse.audio) {
      throw new Error("Provider audio playback is not available in this environment.");
    }

    const byteCharacters = window.atob(planResponse.audio.base64);
    const byteNumbers = Array.from(byteCharacters, (character) => character.charCodeAt(0));
    const audioBlob = new Blob([new Uint8Array(byteNumbers)], {
      type: planResponse.audio.mimeType
    });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    activeAudioRef.current = audio;
    activeAudioUrlRef.current = audioUrl;

    audio.onplay = () => {
      setVoicePlaybackState("speaking");
      setVoiceStatusMessage(
        locale === "zh"
          ? `当前正在播放真人语音：${planResponse.provider}`
          : `Playing provider voice audio via ${planResponse.provider}.`
      );
    };
    audio.onended = () => {
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
      if (activeAudioUrlRef.current === audioUrl) {
        URL.revokeObjectURL(audioUrl);
        activeAudioUrlRef.current = null;
      }
      setVoicePlaybackState("idle");
      setVoiceStatusMessage(
        voiceConversationModeRef.current
          ? locale === "zh"
            ? "我说完了，继续听你。"
            : "I have finished speaking. I am listening again."
          : locale === "zh"
            ? "语音播放完成。"
            : "Voice playback finished."
      );
      if (voiceConversationModeRef.current) {
        scheduleVoiceConversationResume("reply-finished");
      }
    };
    audio.onerror = () => {
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
      if (activeAudioUrlRef.current === audioUrl) {
        URL.revokeObjectURL(audioUrl);
        activeAudioUrlRef.current = null;
      }
      setVoicePlaybackState("error");
      setVoiceStatusMessage(
        locale === "zh" ? "真实语音播放失败了。" : "Provider voice playback failed."
      );
      if (voiceConversationModeRef.current) {
        scheduleVoiceConversationResume("reply-finished");
      }
    };

    await audio.play();
  }

  function stopVoicePlayback(): void {
    clearVoiceConversationResumeTimer();

    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onstart = null;
      activeUtteranceRef.current.onend = null;
      activeUtteranceRef.current.onerror = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    activeUtteranceRef.current = null;

    if (activeAudioRef.current) {
      activeAudioRef.current.onplay = null;
      activeAudioRef.current.onended = null;
      activeAudioRef.current.onerror = null;
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }

    if (activeAudioUrlRef.current) {
      URL.revokeObjectURL(activeAudioUrlRef.current);
      activeAudioUrlRef.current = null;
    }
  }

  function stopSpeechRecognition(options?: { markManualStop?: boolean }): void {
    const recognition = speechRecognitionRef.current;

    if (options?.markManualStop) {
      speechInputManualStopRef.current = true;
    }

    if (!recognition) {
      return;
    }

    speechRecognitionRef.current = null;
    speechInputModeRef.current = null;
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.stop();
  }

  function requestStopProviderSpeechCapture(options?: {
    markManualStop?: boolean;
    finalize?: boolean;
  }): void {
    if (options?.markManualStop) {
      speechInputManualStopRef.current = true;
    }

    const recorder = mediaRecorderRef.current;

    clearProviderSpeechStopTimer();

    if (!recorder) {
      cleanupProviderSpeechCapture();
      return;
    }

    if (options?.finalize === false) {
      recorder.onstop = null;
      cleanupProviderSpeechCapture();
      return;
    }

    if (recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    cleanupProviderSpeechCapture();
  }

  function cleanupProviderSpeechCapture(): void {
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;

    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onerror = null;
      recorder.onstop = null;
    }

    const stream = mediaRecorderStreamRef.current;
    mediaRecorderStreamRef.current = null;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  function startProviderSpeechActivityMonitor(stream: MediaStream): void {
    if (typeof window === "undefined") {
      return;
    }

    clearProviderSpeechStopTimer();
    stopProviderSpeechActivityMonitor();

    const AudioContextCtor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    providerSpeechStartedAtRef.current = performance.now();
    providerSpeechLastActiveAtRef.current = providerSpeechStartedAtRef.current;
    providerSpeechHeardVoiceRef.current = false;

    if (!AudioContextCtor) {
      scheduleProviderSpeechStop(PROVIDER_STT_MAX_CAPTURE_MS);
      return;
    }

    const audioContext = new AudioContextCtor();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;
    source.connect(analyser);

    providerSpeechAudioContextRef.current = audioContext;
    providerSpeechAnalyserRef.current = analyser;
    providerSpeechSourceRef.current = source;

    const sampleBuffer = new Uint8Array(analyser.fftSize);

    const tick = () => {
      const activeRecorder = mediaRecorderRef.current;

      if (!activeRecorder || activeRecorder.state !== "recording") {
        providerSpeechFrameRef.current = null;
        return;
      }

      const now = performance.now();
      const elapsedMs = now - providerSpeechStartedAtRef.current;

      analyser.getByteTimeDomainData(sampleBuffer);
      const activity = measureSpeechActivity(sampleBuffer);

      if (activity >= PROVIDER_STT_ACTIVITY_THRESHOLD) {
        providerSpeechHeardVoiceRef.current = true;
        providerSpeechLastActiveAtRef.current = now;
      }

      const silenceMs = now - providerSpeechLastActiveAtRef.current;
      const shouldStopForSilence =
        providerSpeechHeardVoiceRef.current &&
        elapsedMs >= PROVIDER_STT_MIN_CAPTURE_MS &&
        silenceMs >= PROVIDER_STT_SILENCE_GRACE_MS;

      const shouldStopForMaxDuration = elapsedMs >= PROVIDER_STT_MAX_CAPTURE_MS;

      if (shouldStopForSilence || shouldStopForMaxDuration) {
        requestStopProviderSpeechCapture();
        return;
      }

      providerSpeechFrameRef.current = window.requestAnimationFrame(tick);
    };

    providerSpeechFrameRef.current = window.requestAnimationFrame(tick);
  }

  function scheduleProviderSpeechStop(delayMs: number): void {
    if (typeof window === "undefined") {
      return;
    }

    clearProviderSpeechStopTimer();
    providerSpeechStopTimerRef.current = window.setTimeout(() => {
      providerSpeechStopTimerRef.current = null;
      requestStopProviderSpeechCapture();
    }, delayMs);
  }

  function clearProviderSpeechStopTimer(): void {
    if (typeof window === "undefined" || providerSpeechStopTimerRef.current === null) {
      return;
    }

    window.clearTimeout(providerSpeechStopTimerRef.current);
    providerSpeechStopTimerRef.current = null;
  }

  function stopProviderSpeechActivityMonitor(): void {
    if (typeof window !== "undefined" && providerSpeechFrameRef.current !== null) {
      window.cancelAnimationFrame(providerSpeechFrameRef.current);
      providerSpeechFrameRef.current = null;
    }

    providerSpeechSourceRef.current?.disconnect();
    providerSpeechSourceRef.current = null;
    providerSpeechAnalyserRef.current?.disconnect();
    providerSpeechAnalyserRef.current = null;

    const audioContext = providerSpeechAudioContextRef.current;
    providerSpeechAudioContextRef.current = null;

    if (audioContext) {
      void audioContext.close().catch(() => {
        // Ignore shutdown failures during browser cleanup.
      });
    }
  }

  async function handleExecutePendingLocalAction(): Promise<void> {
    if (!pendingLocalAction || !activeSessionId) {
      return;
    }

    if (permissionProfile.localActions === "deny") {
      setStatusMessage(
        locale === "zh"
          ? "当前本地动作权限为拒绝，先在聊天旁的权限面板里改成按需询问或允许。"
          : "Local actions are currently denied. Change the permission beside the composer first."
      );
      return;
    }

    setLocalActionResolveState("loading");

    try {
      const response = await fetchJson<LocalActionRouteResult>("/api/chat/local-action/execute", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSessionId,
          actionId: pendingLocalAction.id,
          permission: permissionProfile.localActions,
          approved: true,
          locale
        })
      });

      if (response.session) {
        applySessionSnapshot(response.session);
      } else {
        setPendingLocalAction(null);
      }

      setLocalActionResolveState("success");
      setStatusMessage(localizeLocalActionMessage(response.result.message, locale));
    } catch (error) {
      setLocalActionResolveState("error");
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleDismissPendingLocalAction(): Promise<void> {
    if (!pendingLocalAction || !activeSessionId) {
      return;
    }

    setLocalActionResolveState("loading");

    try {
      const response = await fetchJson<LocalActionRouteResult>("/api/chat/local-action/dismiss", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSessionId,
          actionId: pendingLocalAction.id,
          locale
        })
      });

      if (response.session) {
        applySessionSnapshot(response.session);
      } else {
        setPendingLocalAction(null);
      }

      setLocalActionResolveState("success");
      setStatusMessage(
        locale === "zh"
          ? "已取消这次本地动作请求。"
          : "Dismissed this local action request."
      );
    } catch (error) {
      setLocalActionResolveState("error");
      setStatusMessage(getErrorMessage(error));
    }
  }

  useEffect(() => {
    if (!pendingLocalAction || !activeSessionId) {
      return;
    }

    if (permissionProfile.localActions !== "allow") {
      return;
    }

    if (localActionResolveState === "loading") {
      return;
    }

    void handleExecutePendingLocalAction();
  }, [
    activeSessionId,
    localActionResolveState,
    pendingLocalAction,
    permissionProfile.localActions
  ]);

  const isBusy =
    loadState === "loading" ||
    modelsState === "loading" ||
    saveState === "loading" ||
    persistenceState === "loading";
  const canFetchModels = Boolean(selectedProvider && baseURL.trim() && apiKey.trim()) && modelsState !== "loading";
  const canSaveConfig =
    Boolean(selectedProvider && baseURL.trim() && apiKey.trim() && selectedModel) && saveState !== "loading";
  const canAdjustVoiceConfig = Boolean(voiceConfig) && voiceConfigState !== "loading";
  const selectedPreset = presets.find((preset) => preset.id === selectedProvider) ?? null;
  const selectedVoicePreset =
    voicePresets.find((preset) => preset.id === voiceConfig?.qualityProfile) ?? null;
  const availableVoiceModels = Array.from(
    new Set(
      [
        ...voicePresets.map((preset) => preset.model),
        ...(voiceConfig?.model ? [voiceConfig.model] : [])
      ].filter(Boolean)
    )
  );
  const availableVoices = Array.from(
    new Set(
      [
        ...voicePresets.map((preset) => preset.voice),
        ...(voiceConfig?.voice ? [voiceConfig.voice] : [])
      ].filter(Boolean)
    )
  );
  const voiceProviderMode = voiceConfig?.providerMode ?? "shared";
  const usesDedicatedVoiceProvider = voiceProviderMode === "dedicated";
  const usesLocalVoiceProvider =
    usesDedicatedVoiceProvider && (voiceConfig?.provider ?? "").trim().toLowerCase() === "local";
  const usesDoubaoVoiceProvider =
    usesDedicatedVoiceProvider && (voiceConfig?.provider ?? "").trim().toLowerCase() === "doubao";
  const usesDoubaoLegacyVoiceProvider =
    usesDedicatedVoiceProvider &&
    (voiceConfig?.provider ?? "").trim().toLowerCase() === "doubao-legacy";
  const selectedVoiceProviderPreset =
    voiceProviderPresets.find(
      (preset) =>
        preset.provider === (voiceConfig?.provider ?? "") &&
        preset.baseURL === (voiceConfig?.baseURL ?? "")
    ) ??
    voiceProviderPresets.find((preset) => preset.provider === (voiceConfig?.provider ?? "")) ??
    null;
  const usesLiveVoiceCatalog = activeConsoleWorkspace === "voice" && voiceCatalog !== null;
  const activeVoiceProviderType =
    selectedVoiceProviderPreset?.providerType ??
    ((voiceConfig?.provider ?? "").trim().toLowerCase() === "gemini"
      ? "gemini"
      : usesDoubaoVoiceProvider
        ? "doubao"
        : usesDoubaoLegacyVoiceProvider
          ? "doubao-legacy"
        : usesLocalVoiceProvider
          ? "local"
          : "openai-compatible");
  const voiceStatusProviderType = usesDedicatedVoiceProvider
    ? activeVoiceProviderType
    : voiceRoutingStatus?.providerType ?? "shared-chat-provider";
  const voiceStatusProviderLabel = usesDedicatedVoiceProvider
    ? voiceConfig?.provider || "dedicated"
    : voiceRoutingStatus?.providerLabel || "shared";
  const supportsProviderPresetSelection = usesDedicatedVoiceProvider;
  const preferredVoiceFieldMode =
    selectedVoiceProviderPreset?.voiceFieldMode ??
    (usesDoubaoVoiceProvider || usesDoubaoLegacyVoiceProvider || usesLocalVoiceProvider
      ? "input"
      : "select");
  const visibleVoiceModelDescriptors = usesLiveVoiceCatalog
    ? voiceCatalog.models
    : availableVoiceModels.map((model) => ({
        id: model,
        provider: voiceConfig?.provider ?? "voice",
        label: model
      }));
  const visibleVoiceOptionDescriptors = usesLiveVoiceCatalog
    ? voiceCatalog.voices
    : availableVoices.map((voice) => ({
        id: voice,
        label: voice
      }));
  const normalizedVoiceSearchQuery = voiceSearchQuery.trim().toLowerCase();
  const filteredVoiceOptionDescriptors =
    normalizedVoiceSearchQuery.length > 0
      ? visibleVoiceOptionDescriptors.filter((voice) => {
          const haystack = `${voice.label} ${voice.id}`.toLowerCase();
          return haystack.includes(normalizedVoiceSearchQuery);
        })
      : visibleVoiceOptionDescriptors;
  const voiceFieldMode =
    usesDedicatedVoiceProvider && usesLiveVoiceCatalog
      ? voiceCatalog.voiceFieldMode
      : usesDedicatedVoiceProvider
        ? preferredVoiceFieldMode
        : "select";
  const voiceFieldLabel =
    usesDedicatedVoiceProvider && activeVoiceProviderType === "doubao"
      ? locale === "zh"
        ? "音色 / voice_type"
        : "Voice / voice_type"
      : usesDedicatedVoiceProvider && activeVoiceProviderType === "local"
        ? locale === "zh"
          ? "音色 / Speaker"
          : "Voice / Speaker"
        : usesDedicatedVoiceProvider && voiceFieldMode === "input"
          ? locale === "zh"
            ? "音色 / Voice ID"
            : "Voice / Voice ID"
        : locale === "zh"
          ? "声线"
          : "Voice";
  const voiceFieldPlaceholder =
    usesDedicatedVoiceProvider && activeVoiceProviderType === "doubao"
      ? "zh_female_gaolengyujie_uranus_bigtts"
      : usesDedicatedVoiceProvider && activeVoiceProviderType === "doubao-legacy"
        ? "multi_female_shuangkuaisisi_moon_bigtts"
      : usesDedicatedVoiceProvider && activeVoiceProviderType === "local"
        ? locale === "zh"
          ? "输入 speaker 或 voice id"
          : "Enter speaker or voice id"
        : usesDedicatedVoiceProvider && voiceFieldMode === "input"
          ? locale === "zh"
            ? "输入供应商的音色 / speaker ID"
            : "Enter the provider voice or speaker ID"
        : locale === "zh"
          ? "输入音色名称"
          : "Enter a voice name";
  const selectedVoiceProviderPresetId = selectedVoiceProviderPreset?.id ?? null;
  const activeVoiceCatalogNote =
    (selectedVoiceProviderPresetId === "gemini-micu" && locale !== "zh"
      ? "For Micu relay, prefer the Gemini TTS model names Micu actually recognizes. The current verified Micu-recognized names are `gemini-2.5-flash-tts-preview` and `gemini-2.5-pro-tts-preview`, while `gemini-3.1-flash-tts-preview` and the official `*-preview-tts` aliases currently return model_not_found on Micu."
      : undefined) ??
    voiceCatalog?.notes ??
    selectedVoiceProviderPreset?.notes ??
    (usesDedicatedVoiceProvider
      ? locale === "zh"
        ? "选好语音供应商后，在这里完成模型和音色路由。"
        : "Choose the dedicated voice vendor here, then finish model and voice routing in one place."
      : locale === "zh"
        ? "共享模式会继续使用聊天模型的内容路径，但依然可单独调整语音风格。"
        : "Shared mode keeps the chat provider path, while still letting you tune the delivery profile separately.");
  const showVoiceCatalogAction =
    supportsProviderPresetSelection &&
    activeVoiceProviderType !== "local" &&
    activeVoiceProviderType !== "doubao-legacy" &&
    activeVoiceProviderType !== "gemini";
  const voiceCatalogActionLabel =
    activeVoiceProviderType === "fish-audio"
      ? locale === "zh"
        ? "获取音色目录"
        : "Fetch voice catalog"
      : locale === "zh"
        ? "获取模型目录"
        : "Fetch model catalog";
  const showSearchableVoicePicker = voiceFieldMode === "select" && visibleVoiceOptionDescriptors.length > 0;
  const selectedVoiceDescriptor =
    visibleVoiceOptionDescriptors.find((voice) => voice.id === (voiceConfig?.voice ?? "")) ?? null;
  const activeVoicePickerLabel =
    selectedVoiceDescriptor?.label ?? (voiceDraftInput.trim() || voiceFieldPlaceholder);
  const voiceSearchEmptyLabel =
    locale === "zh" ? "没有匹配的音色，换个关键词试试。" : "No matching voices. Try another keyword.";
  const voiceSearchPlaceholder =
    locale === "zh" ? "搜索音色名或 ID" : "Search voices or IDs";
  const voiceRoutingTargetLabel =
    voiceRoutingStatus?.target === "provider-audio"
      ? locale === "zh"
        ? "真人语音"
        : "Provider audio"
      : locale === "zh"
        ? "浏览器兜底"
        : "Browser fallback";
  const voiceRoutingReadyLabel =
    voiceRoutingStatus?.ready === true
      ? locale === "zh"
        ? "已就绪"
        : "Ready"
      : locale === "zh"
        ? "未就绪"
        : "Not ready";
  const voiceRoutingMissingFieldsLabel =
    voiceRoutingStatus && voiceRoutingStatus.missingFields.length > 0
      ? voiceRoutingStatus.missingFields
          .map((field) =>
            field === "apiKey"
              ? "API Key"
              : field === "resourceId"
                ? "Resource ID"
                : field === "baseURL"
                  ? "Base URL"
                  : locale === "zh"
                    ? "供应商"
                    : "Provider"
          )
          .join(" / ")
      : locale === "zh"
        ? "无"
        : "None";
  const formattedVoiceFallbackReason = formatVoiceFallbackReason(
    voiceRoutingStatus?.fallbackReason,
    voiceRoutingStatus?.providerType,
    selectedVoiceProviderPresetId,
    locale
  );
  const voiceRoutingDetailMessage =
    formattedVoiceFallbackReason ||
    voiceRoutingStatus?.summary ||
    (locale === "zh"
      ? "当前会根据回复情绪规划语气，实时对话打开后会直接进入说与听的循环。"
      : "Reply playback follows emotional delivery hints, and realtime mode moves directly into a speak-and-listen loop.");
  const voiceStatusGuidanceNote = usesDedicatedVoiceProvider
    ? activeVoiceCatalogNote
    : locale === "zh"
      ? "\u5171\u4eab\u6a21\u5f0f\u4f1a\u7ee7\u7eed\u4f7f\u7528\u804a\u5929\u4f9b\u5e94\u5546\u7684\u5185\u5bb9\u8def\u5f84\uff0c\u4f46\u4f60\u4ecd\u53ef\u4ee5\u5355\u72ec\u8c03\u6574\u8bed\u97f3\u98ce\u683c\u3002"
      : "Shared mode keeps using the chat-provider route, while still letting you tune the voice delivery profile separately.";
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
  const canLoadSampleSession = Boolean(sessionPackageReference) && sessionImportState !== "loading";
  const canSaveProactiveSettings =
    Boolean(activeSessionId && proactiveCarePolicy && proactiveCareState) && proactiveSaveState !== "loading";
  const canEvaluateProactive =
    Boolean(activeSessionId) && proactiveEvaluateState !== "loading";
  const alternateBackendStatus =
    persistenceStatus?.backendDetails.find((detail) => detail.backend !== persistenceStatus.backend) ?? null;
  const hasSessionArchive =
    sessionMemoryArchive.length > 0 || sessionTimelineEvents.length > 0 || Boolean(sessionRelationship);
  const configuredRuntimeLabel = savedConfig
    ? `${savedConfig.provider} / ${savedConfig.model}`
    : copy.formatting.runtimeNotConfigured;
  const sessionSummaryLabel = copy.formatting.localSessionsAvailable(chatSessions.length);
  const archiveSummaryLabel = hasSessionArchive
    ? copy.formatting.archiveSummary(sessionMemoryArchive.length, sessionTimelineEvents.length)
    : copy.formatting.noArchive;
  const runtimeStateLabel = chatReady ? copy.formatting.ready : copy.formatting.waiting;
  const configuredProviderLabel = savedConfig?.provider ?? (locale === "zh" ? "未配置供应商" : "No provider");
  const configuredModelLabel = savedConfig?.model ?? (locale === "zh" ? "未选择模型" : "No model selected");
  const navigationItems: ReadonlyArray<{ page: AppPage; label: string }> = [
    { page: "home", label: copy.nav[0] },
    { page: "console", label: copy.nav[4] },
    { page: "chat", label: locale === "zh" ? "对话" : "Chat" },
    { page: "roadmap", label: copy.nav[5] }
  ];
  const consoleWorkspaceLabels: Record<Exclude<ConsoleWorkspace, "voice">, string> =
    locale === "zh"
      ? {
          provider: "模型接入",
          sessions: "会话档案",
          care: "主动关怀",
          runtime: "运行信号"
        }
      : {
          provider: "Provider",
          sessions: "Sessions",
          care: "Care",
          runtime: "Runtime"
        };
  const consoleWorkspaceDescriptions: Record<Exclude<ConsoleWorkspace, "voice">, string> =
    locale === "zh"
      ? {
          provider: "供应商、密钥、模型发现与运行路径固定。",
          sessions: "会话身份、持久化、导入导出与权限中心。",
          care: "主动关怀策略、通知与本地检查循环。",
          runtime: "当前关系、记忆、时间轴与导出结果。"
        }
      : {
          provider: "Vendor setup, credentials, model discovery, and one stable runtime path.",
          sessions: "Session identity, persistence, import/export, and the permission center.",
          care: "Proactive-care policy, browser delivery, and bounded local checks.",
          runtime: "Current relationship, memory, timeline, and structured export output."
        };
  const consoleWorkspaceLabelsResolved = {
    ...consoleWorkspaceLabels,
    voice: locale === "zh" ? "语音设置" : "Voice"
  } satisfies Record<ConsoleWorkspace, string>;
  const consoleWorkspaceDescriptionsResolved = {
    ...consoleWorkspaceDescriptions,
    voice:
      locale === "zh"
        ? "实时对话、真人语音和本地 / 国内语音供应路径。"
        : "Realtime conversation, natural voice, and shared or dedicated voice routing."
  } satisfies Record<ConsoleWorkspace, string>;
  const activeBurnPortrait = heroPortraitCards[activeBurnPortraitIndex] ?? heroPortraitCards[0]!;

  useEffect(() => {
    if (currentPage !== "console") {
      return;
    }

    if (!chatReady && activeConsoleWorkspace !== "provider") {
      setActiveConsoleWorkspace("provider");
    }
  }, [activeConsoleWorkspace, chatReady, currentPage]);

  useEffect(() => {
    setVoiceDraftInput(voiceConfig?.voice ?? "");
  }, [voiceConfig?.voice]);

  useEffect(() => {
    setVoiceSearchQuery(voiceConfig?.voice ?? "");
  }, [voiceConfig?.voice]);

  useEffect(() => {
    if (!usesDedicatedVoiceProvider || !selectedVoiceProviderPresetId) {
      return;
    }

    if (voiceCatalog !== null) {
      return;
    }

    if (
      selectedVoiceProviderPresetId !== "doubao" &&
      selectedVoiceProviderPresetId !== "doubao-legacy" &&
      selectedVoiceProviderPresetId !== "gemini" &&
      selectedVoiceProviderPresetId !== "gemini-micu"
    ) {
      return;
    }

    void handleFetchVoiceCatalog();
  }, [
    selectedVoiceProviderPresetId,
    usesDedicatedVoiceProvider,
    voiceCatalog,
    voiceConfig?.provider,
    voiceConfig?.baseURL,
    voiceConfig?.apiKey,
    voiceConfig?.accessKeyId,
    voiceConfig?.secretAccessKey
  ]);

  useEffect(() => {
    if (!voicePickerOpen || typeof window === "undefined") {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!voicePickerRef.current) {
        return;
      }

      if (voicePickerRef.current.contains(event.target as Node)) {
        return;
      }

      setVoicePickerOpen(false);
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [voicePickerOpen]);

  function renderVoiceConfigControls(mode: "chat" | "console"): ReactElement {
    const isConsole = mode === "console";

    if (!isConsole) {
      return (
        <div className="chat-voice-controls chat-voice-controls-compact">
          <button
            className={`button button-secondary ${voiceConversationMode ? "chat-voice-button-active" : ""}`}
            onClick={() => handleToggleSpeechInput()}
            disabled={
              !chatReady ||
              chatState === "loading" ||
              speechInputState === "processing" ||
              speechInputState === "unsupported"
            }
            type="button"
          >
            {voiceConversationMode ? (locale === "zh" ? "结束实时对话" : "End live chat") : locale === "zh" ? "开始实时对话" : "Start live chat"}
          </button>
          <div className="chat-voice-compact-summary">
            <strong>
              {usesDedicatedVoiceProvider
                ? locale === "zh"
                  ? "独立真人语音"
                  : "Dedicated voice"
                : locale === "zh"
                  ? "跟随聊天模型"
                  : "Shared with chat"}
            </strong>
            <span>
              {selectedVoicePreset?.label ?? (locale === "zh" ? "默认预设" : "Default preset")}
              {voiceConfig?.voice ? ` · ${voiceConfig.voice}` : ""}
            </span>
          </div>
          <button
            className="button button-secondary"
            onClick={() => {
              setActiveConsoleWorkspace("voice");
              navigateTo("console");
            }}
            type="button"
          >
            {locale === "zh" ? "语音设置" : "Voice settings"}
          </button>
        </div>
      );
    }

    return (
      <div className={`chat-voice-controls ${isConsole ? "console-voice-controls" : ""}`}>
        <div className="voice-config-grid">
          <section className="voice-config-section">
            <div className="voice-config-section-head">
              <strong>{locale === "zh" ? "基础路由" : "Routing basics"}</strong>
              <span>{locale === "zh" ? "先决定语音是否跟随聊天模型" : "Decide whether voice follows chat or stays dedicated."}</span>
            </div>
            <div className="voice-config-fields">
              <label className="chat-voice-select">
                <span>{locale === "zh" ? "风格" : "Profile"}</span>
                <select
                  value={voiceConfig?.qualityProfile ?? ""}
                  onChange={(event) => void handleVoiceProfileChange(event.target.value)}
                  disabled={!canAdjustVoiceConfig}
                >
                  {voicePresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="chat-voice-select">
                <span>{locale === "zh" ? "来源" : "Source"}</span>
                <select
                  value={voiceProviderMode}
                  onChange={(event) =>
                    void handleVoiceProviderModeChange(event.target.value === "dedicated" ? "dedicated" : "shared")
                  }
                  disabled={!canAdjustVoiceConfig}
                >
                  <option value="shared">{locale === "zh" ? "跟随聊天模型" : "Use chat provider"}</option>
                  <option value="dedicated">{locale === "zh" ? "独立真人语音" : "Dedicated voice provider"}</option>
                </select>
              </label>
            </div>
          </section>

          <section className="voice-config-section">
            <div className="voice-config-section-head">
              <strong>{locale === "zh" ? "输出选择" : "Output selection"}</strong>
              <span>{locale === "zh" ? "模型可以发现，音色则按供应商能力决定下拉或手填" : "Models can be discovered; voices are either selectable or manually entered depending on the vendor."}</span>
            </div>
            <div className="voice-config-fields">
              <label className="chat-voice-select chat-voice-select-compact">
                <span>{locale === "zh" ? "模型" : "Model"}</span>
                <select
                  value={voiceConfig?.model ?? ""}
                  onChange={(event) => void handleVoiceModelChange(event.target.value)}
                  disabled={!canAdjustVoiceConfig}
                >
                  {visibleVoiceModelDescriptors.map((model) => (
                    <option key={model.id} value={model.id}>
                      {formatModelOptionLabel(model)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="chat-voice-select chat-voice-select-compact">
                <span>{voiceFieldLabel}</span>
                {showSearchableVoicePicker ? (
                  <div className="voice-search-picker" ref={voicePickerRef}>
                    <button
                      className="voice-search-picker-trigger"
                      type="button"
                      onClick={() => setVoicePickerOpen((current) => !current)}
                      disabled={!canAdjustVoiceConfig}
                      aria-expanded={voicePickerOpen}
                    >
                      <strong>{activeVoicePickerLabel}</strong>
                      <span>{voiceConfig?.voice ?? voiceFieldPlaceholder}</span>
                    </button>
                    {voicePickerOpen ? (
                      <div className="voice-search-picker-popover">
                        <input
                          type="text"
                          value={voiceSearchQuery}
                          onChange={(event) => setVoiceSearchQuery(event.target.value)}
                          placeholder={voiceSearchPlaceholder}
                          disabled={!canAdjustVoiceConfig}
                          autoFocus
                        />
                        <div className="voice-search-picker-list" role="listbox">
                          {filteredVoiceOptionDescriptors.length > 0 ? (
                            filteredVoiceOptionDescriptors.map((voice) => {
                              const isActive = voice.id === (voiceConfig?.voice ?? "");
                              return (
                                <button
                                  key={voice.id}
                                  className={`voice-search-picker-option${isActive ? " voice-search-picker-option-active" : ""}`}
                                  type="button"
                                  onClick={() => {
                                    setVoiceDraftInput(voice.id);
                                    setVoiceSearchQuery(voice.id);
                                    setVoicePickerOpen(false);
                                    void handleVoiceNameChange(voice.id);
                                  }}
                                  disabled={!canAdjustVoiceConfig}
                                >
                                  <strong>{voice.label}</strong>
                                  <span>{voice.id}</span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="voice-search-picker-empty">{voiceSearchEmptyLabel}</div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={voiceDraftInput}
                    onChange={(event) => {
                      setVoiceDraftInput(event.target.value);
                      setVoiceSearchQuery(event.target.value);
                    }}
                    placeholder={voiceFieldPlaceholder}
                    disabled={!canAdjustVoiceConfig}
                  />
                )}
              </label>
              <div className="chat-voice-select chat-voice-select-block voice-save-row">
                <button
                  className="button button-secondary button-compact"
                  type="button"
                  onClick={() => void handleSaveVoiceDraft()}
                  disabled={!canAdjustVoiceConfig}
                >
                  {locale === "zh" ? "保存当前音色" : "Save current voice"}
                </button>
                {voiceRoutingStatus?.attemptedProviderAudio && voiceRoutingStatus.fallbackReason ? (
                  <span className="voice-save-warning">
                    {formattedVoiceFallbackReason ?? voiceRoutingStatus.fallbackReason}
                  </span>
                ) : null}
              </div>
            </div>
          </section>

          {usesDedicatedVoiceProvider ? (
            <section className="voice-config-section voice-config-section-wide">
              <div className="voice-config-section-head">
                <strong>{locale === "zh" ? "供应商配置" : "Provider setup"}</strong>
                <span>
                  {activeVoiceProviderType === "doubao"
                    ? locale === "zh"
                      ? "豆包需要独立 API Key 与 Resource ID。"
                      : "Doubao needs its own API key and resource ID."
                    : activeVoiceProviderType === "local"
                      ? locale === "zh"
                        ? "本地桥接按你的引擎字段精确填写。"
                        : "Local bridges should be configured with engine-specific fields."
                      : voiceFieldMode === "select"
                        ? locale === "zh"
                          ? "这类供应商可以复用已知音色目录。"
                          : "This vendor can reuse a known voice directory."
                        : locale === "zh"
                          ? "这类供应商建议发现模型后手填 voice / speaker ID。"
                          : "For this vendor, discover the model first and enter the voice or speaker ID manually."}
                </span>
              </div>
              <div className="voice-config-fields">
                <label className="chat-voice-select">
                  <span>{locale === "zh" ? "供应商" : "Provider"}</span>
                  <input
                    type="text"
                    value={voiceConfig?.provider ?? ""}
                    onChange={(event) =>
                      setVoiceConfig((current) => (current ? { ...current, provider: event.target.value } : current))
                    }
                    onBlur={(event) => void handleVoiceProviderFieldChange("provider", event.target.value)}
                    placeholder={locale === "zh" ? "例如 openai" : "e.g. openai"}
                    disabled={!canAdjustVoiceConfig}
                  />
                </label>
                <label className="chat-voice-select">
                  <span>{locale === "zh" ? "\u8bed\u97f3 Key" : "Voice Key"}</span>
                  <input
                    type="password"
                    value={voiceConfig?.apiKey ?? ""}
                    onChange={(event) =>
                      setVoiceConfig((current) => (current ? { ...current, apiKey: event.target.value } : current))
                    }
                    onBlur={(event) => void handleVoiceProviderFieldChange("apiKey", event.target.value)}
                    placeholder={
                      activeVoiceProviderType === "local"
                        ? locale === "zh"
                          ? "\u53ef\u9009\uff1a\u5982\u679c\u672c\u5730\u6865\u63a5\u9700\u8981\u9274\u6743\uff0c\u5728\u8fd9\u91cc\u586b\u5165"
                          : "Optional: enter it if your local bridge requires auth"
                        : locale === "zh"
                          ? "\u586b\u5165\u771f\u4eba\u8bed\u97f3 API Key"
                          : "Enter dedicated voice API key"
                    }
                    disabled={!canAdjustVoiceConfig}
                  />
                </label>
                <label className="chat-voice-select chat-voice-select-wide">
                  <span>Base URL</span>
                  <input
                    type="text"
                    value={voiceConfig?.baseURL ?? ""}
                    onChange={(event) =>
                      setVoiceConfig((current) => (current ? { ...current, baseURL: event.target.value } : current))
                    }
                    onBlur={(event) => void handleVoiceProviderFieldChange("baseURL", event.target.value)}
                    placeholder="https://api.openai.com/v1"
                    disabled={!canAdjustVoiceConfig}
                  />
                </label>
                {activeVoiceProviderType === "doubao" ? (
                  <>
                    <label className="chat-voice-select">
                      <span>Resource ID</span>
                      <input
                        type="text"
                        value={voiceConfig?.resourceId ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current ? { ...current, resourceId: event.target.value } : current
                          )
                        }
                        onBlur={(event) =>
                          void handleVoiceProviderFieldChange("resourceId", event.target.value)
                        }
                        placeholder="seed-tts-2.0"
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                    <label className="chat-voice-select">
                      <span>Access Key ID</span>
                      <input
                        type="text"
                        value={voiceConfig?.accessKeyId ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current ? { ...current, accessKeyId: event.target.value } : current
                          )
                        }
                        onBlur={(event) =>
                          void handleVoiceProviderFieldChange("accessKeyId", event.target.value)
                        }
                        placeholder="Optional: for live ListSpeakers"
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                    <label className="chat-voice-select">
                      <span>Secret Access Key</span>
                      <input
                        type="password"
                        value={voiceConfig?.secretAccessKey ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current ? { ...current, secretAccessKey: event.target.value } : current
                          )
                        }
                        onBlur={(event) =>
                          void handleVoiceProviderFieldChange("secretAccessKey", event.target.value)
                        }
                        placeholder="Optional: for live ListSpeakers"
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                  </>
                ) : null}
                {activeVoiceProviderType === "doubao-legacy" ? (
                  <>
                    <label className="chat-voice-select">
                      <span>App ID</span>
                      <input
                        type="text"
                        value={voiceConfig?.appId ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current ? { ...current, appId: event.target.value } : current
                          )
                        }
                        onBlur={(event) =>
                          void handleVoiceProviderFieldChange("appId", event.target.value)
                        }
                        placeholder="3086540171"
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                  </>
                ) : null}
                {activeVoiceProviderType === "local" ? (
                  <>
                    <label className="chat-voice-select">
                      <span>{locale === "zh" ? "引擎" : "Engine"}</span>
                      <input
                        type="text"
                        value={voiceConfig?.engine ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) => (current ? { ...current, engine: event.target.value } : current))
                        }
                        onBlur={(event) => void handleVoiceProviderFieldChange("engine", event.target.value)}
                        placeholder={locale === "zh" ? "例如 gpt-sovits" : "e.g. gpt-sovits"}
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                    <label className="chat-voice-select">
                      <span>{locale === "zh" ? "接口路径" : "Endpoint"}</span>
                      <input
                        type="text"
                        value={voiceConfig?.endpointPath ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current ? { ...current, endpointPath: event.target.value } : current
                          )
                        }
                        onBlur={(event) => void handleVoiceProviderFieldChange("endpointPath", event.target.value)}
                        placeholder="/tts"
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                    <label className="chat-voice-select">
                      <span>Speaker</span>
                      <input
                        type="text"
                        value={voiceConfig?.speaker ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) => (current ? { ...current, speaker: event.target.value } : current))
                        }
                        onBlur={(event) => void handleVoiceProviderFieldChange("speaker", event.target.value)}
                        placeholder={locale === "zh" ? "可选 speaker" : "Optional speaker"}
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                    <label className="chat-voice-select chat-voice-select-wide">
                      <span>{locale === "zh" ? "参考音色 ID" : "Reference Voice ID"}</span>
                      <input
                        type="text"
                        value={voiceConfig?.referenceVoiceId ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current ? { ...current, referenceVoiceId: event.target.value } : current
                          )
                        }
                        onBlur={(event) => void handleVoiceProviderFieldChange("referenceVoiceId", event.target.value)}
                        placeholder={locale === "zh" ? "可选参考音色或角色 ID" : "Optional reference voice or role ID"}
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                    <label className="chat-voice-select">
                      <span>{locale === "zh" ? "文本语言" : "Text Lang"}</span>
                      <input
                        type="text"
                        value={voiceConfig?.textLanguage ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current ? { ...current, textLanguage: event.target.value } : current
                          )
                        }
                        onBlur={(event) => void handleVoiceProviderFieldChange("textLanguage", event.target.value)}
                        placeholder="zh / en"
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                    <label className="chat-voice-select">
                      <span>{locale === "zh" ? "提示语言" : "Prompt Lang"}</span>
                      <input
                        type="text"
                        value={voiceConfig?.promptLanguage ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current ? { ...current, promptLanguage: event.target.value } : current
                          )
                        }
                        onBlur={(event) => void handleVoiceProviderFieldChange("promptLanguage", event.target.value)}
                        placeholder="zh / en"
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                    <label className="chat-voice-select">
                      <span>{locale === "zh" ? "风格强度" : "Style"}</span>
                      <input
                        type="number"
                        step="0.1"
                        value={voiceConfig?.styleStrength ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current
                              ? {
                                  ...current,
                                  styleStrength:
                                    event.target.value.trim().length === 0 ? null : Number(event.target.value)
                                }
                              : current
                          )
                        }
                        onBlur={(event) =>
                          void handleVoiceProviderNumberFieldChange("styleStrength", event.target.value)
                        }
                        placeholder="0.7"
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                    <label className="chat-voice-select">
                      <span>Temp</span>
                      <input
                        type="number"
                        step="0.1"
                        value={voiceConfig?.temperature ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current
                              ? {
                                  ...current,
                                  temperature:
                                    event.target.value.trim().length === 0 ? null : Number(event.target.value)
                                }
                              : current
                          )
                        }
                        onBlur={(event) =>
                          void handleVoiceProviderNumberFieldChange("temperature", event.target.value)
                        }
                        placeholder="0.7"
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                    <label className="chat-voice-select">
                      <span>Top P</span>
                      <input
                        type="number"
                        step="0.1"
                        value={voiceConfig?.topP ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current
                              ? {
                                  ...current,
                                  topP:
                                    event.target.value.trim().length === 0 ? null : Number(event.target.value)
                                }
                              : current
                          )
                        }
                        onBlur={(event) => void handleVoiceProviderNumberFieldChange("topP", event.target.value)}
                        placeholder="0.9"
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                    <label className="chat-voice-select chat-voice-select-block chat-voice-select-wide">
                      <span>{locale === "zh" ? "参考文本" : "Reference Text"}</span>
                      <textarea
                        rows={2}
                        value={voiceConfig?.referenceTranscript ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current ? { ...current, referenceTranscript: event.target.value } : current
                          )
                        }
                        onBlur={(event) => void handleVoiceProviderFieldChange("referenceTranscript", event.target.value)}
                        placeholder={locale === "zh" ? "可选参考台词或参考音频对应文本" : "Optional reference transcript"}
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                    <label className="chat-voice-select chat-voice-select-block chat-voice-select-wide">
                      <span>{locale === "zh" ? "风格提示" : "Style Prompt"}</span>
                      <textarea
                        rows={2}
                        value={voiceConfig?.stylePrompt ?? ""}
                        onChange={(event) =>
                          setVoiceConfig((current) =>
                            current ? { ...current, stylePrompt: event.target.value } : current
                          )
                        }
                        onBlur={(event) => void handleVoiceProviderFieldChange("stylePrompt", event.target.value)}
                        placeholder={locale === "zh" ? "例如：更轻、更近、更像耳边低语" : "e.g. gentle, intimate, diary-like"}
                        disabled={!canAdjustVoiceConfig}
                      />
                    </label>
                  </>
                ) : null}
                {false && activeVoiceProviderType !== "local" ? (
                  <label className="chat-voice-select chat-voice-select-wide">
                    <span>{locale === "zh" ? "语音 Key" : "Voice Key"}</span>
                    <input
                      type="password"
                      value={voiceConfig?.apiKey ?? ""}
                      onChange={(event) =>
                        setVoiceConfig((current) => (current ? { ...current, apiKey: event.target.value } : current))
                      }
                      onBlur={(event) => void handleVoiceProviderFieldChange("apiKey", event.target.value)}
                      placeholder={locale === "zh" ? "填入真人语音 API Key" : "Enter dedicated voice API key"}
                      disabled={!canAdjustVoiceConfig}
                    />
                  </label>
                ) : null}
              </div>
            </section>
          ) : (
            <section className="voice-config-section voice-config-section-wide">
              <div className="voice-config-section-head">
                <strong>{locale === "zh" ? "共享模式说明" : "Shared mode"}</strong>
                <span>
                  {locale === "zh"
                    ? "当前语音继续跟随聊天供应商，仅保留独立的语气预设和播放方式。"
                    : "Voice stays on the chat provider path and only keeps its own delivery profile here."}
                </span>
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">Waveary</span>
          <span className="brand-subtitle">{copy.brandSubtitle}</span>
          <span className="brand-caption">{copy.brandCaption}</span>
        </div>

        <div className="topbar-utility">
          <span className="topbar-note">{copy.slogan}</span>
          <div className="topbar-controls">
            <nav className="topnav">
              {navigationItems.map((item) => (
                <button
                  className={`topnav-link ${currentPage === item.page ? "topnav-link-active" : ""}`}
                  key={item.page}
                  onClick={() => navigateTo(item.page)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="language-toggle" aria-label={locale === "zh" ? "界面语言切换" : "Interface language switch"}>
              <button
                className={`language-toggle-button ${locale === "zh" ? "language-toggle-button-active" : ""}`}
                onClick={() => setLocale("zh")}
                type="button"
              >
                中
              </button>
              <button
                className={`language-toggle-button ${locale === "en" ? "language-toggle-button-active" : ""}`}
                onClick={() => setLocale("en")}
                type="button"
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`page-main page-main-${currentPage}`}>
        {currentPage === "home" ? (
          <div className="home-doodle-layer" aria-hidden="true">
            {homeDoodles.map((doodle) => (
              <span
                className="home-doodle"
                key={doodle.id}
                style={
                  {
                    "--doodle-top": doodle.top,
                    "--doodle-left": doodle.left,
                    "--doodle-rotation": doodle.rotation,
                    "--doodle-scale": doodle.scale,
                    "--doodle-delay": doodle.delay
                  } as React.CSSProperties
                }
              >
                <img src={doodle.src} alt="" />
              </span>
            ))}
          </div>
        ) : null}
        {currentPage === "home" ? (
        <section className="hero section-grid" id="home">
          <div className="hero-copy">
            <div className="hero-badge-row">
              <div className="eyebrow">{copy.hero.eyebrow}</div>
              <span className="hero-chip">{copy.hero.chip}</span>
            </div>
            <p className="hero-kicker">{copy.hero.kicker}</p>
            <h1>
              {copy.hero.title[0]}
              <br />
              {copy.hero.title[1]}
            </h1>
            <p className="hero-lead">{copy.hero.lead}</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => navigateTo("home", "intro")} type="button">
                {copy.hero.primary}
              </button>
              <button className="button button-secondary" onClick={() => navigateTo("home", "engines")} type="button">
                {copy.hero.secondary}
              </button>
            </div>
            <p className="hero-support">{copy.hero.support}</p>
            <div className="hero-principle-strip">
              {copy.principles.map((principle) => (
                <div className="hero-principle-pill" key={principle}>
                  {principle}
                </div>
              ))}
            </div>
          </div>

          <div className="hero-frame">
            <article className="hero-frame-panel hero-frame-panel-primary">
              <div className="hero-frame-label-row">
                <span className="hero-frame-label">{copy.heroCards.definitionLabel}</span>
                <span className="hero-frame-chip">Waveary CE</span>
              </div>
              <div className="hero-memory-stage" aria-hidden="true">
                <div className="hero-memory-cloud">
                  {heroPortraitCards.map((card) => (
                    <figure
                      className="hero-memory-photo"
                      key={card.src}
                      style={
                        {
                          "--photo-rotation": card.rotation,
                          "--photo-top": card.top,
                          "--photo-left": card.left,
                          "--photo-delay": card.delay
                        } as React.CSSProperties
                      }
                    >
                      <div className="hero-memory-photo-frame">
                        <img src={card.src} alt={card.alt} />
                      </div>
                    </figure>
                  ))}
                </div>
                <div className="hero-memory-burner">
                  <div className="hero-memory-burn-card" key={activeBurnPortrait.src}>
                    <div className="hero-memory-burn-frame">
                      <img src={activeBurnPortrait.src} alt="" />
                      <span className="hero-memory-burn-glow" />
                      <span className="hero-memory-burn-scorch" />
                      <span className="hero-memory-burn-ash hero-memory-burn-ash-one" />
                      <span className="hero-memory-burn-ash hero-memory-burn-ash-two" />
                      <span className="hero-memory-burn-ash hero-memory-burn-ash-three" />
                    </div>
                  </div>
                  <div className="hero-memory-lighter">
                    <img className="hero-memory-lighter-illustration" src="/images/hero/lighter.png" alt="" />
                    <span className="hero-memory-lighter-flame" aria-hidden="true">
                      <span className="hero-memory-lighter-flame-halo" />
                      <span className="hero-memory-lighter-flame-outer" />
                      <span className="hero-memory-lighter-flame-inner" />
                      <span className="hero-memory-lighter-flame-core" />
                    </span>
                  </div>
                </div>
              </div>
              <strong>{copy.heroCards.definitionTitle}</strong>
              <p>{copy.heroCards.definitionBody}</p>
              <div className="hero-summary-grid">
                {copy.introStatements.slice(0, 2).map((statement) => (
                  <p key={statement}>{statement}</p>
                ))}
              </div>
            </article>

            <div className="hero-frame-footer">
              <article className="hero-frame-panel hero-note-card">
                <span className="hero-frame-label">{copy.heroCards.positioningLabel}</span>
                <strong>{copy.heroCards.positioningTitle}</strong>
                <p>{copy.heroCards.positioningBody}</p>
              </article>
              <article className="hero-frame-panel hero-note-card">
                <span className="hero-frame-label">{copy.heroCards.audienceLabel}</span>
                <strong>{copy.heroCards.audienceTitle}</strong>
                <p>{copy.heroCards.audienceBody}</p>
              </article>
            </div>
          </div>
        </section>
        ) : null}

        {currentPage === "home" ? (
        <section className="section-grid section-block intro-section" id="intro">
          <div className="intro-layout">
            <div className="section-heading intro-heading">
              <span className="section-caption">{copy.intro.caption}</span>
              <h2>{copy.intro.title}</h2>
              <p>{copy.intro.description}</p>
            </div>

            <div className="intro-essay">
              {copy.intro.essay.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="intro-grid">
            {copy.intro.panels.map((panel) => (
              <article className="intro-card" key={panel.title}>
                <span className="intro-card-label">{panel.label}</span>
                <h3>{panel.title}</h3>
                <p>{panel.description}</p>
              </article>
            ))}
          </div>

          <div className="framework-band">
            <div className="framework-band-copy">
              <span className="section-caption">{copy.intro.thesisCaption}</span>
              <h3>{copy.intro.thesisTitle}</h3>
              <p>{copy.intro.thesisBody}</p>
            </div>
            <div className="framework-band-grid">
              {copy.frameworkLayers.map((layer) => (
                <article className="framework-band-card" key={layer.title}>
                  <strong>{layer.title}</strong>
                  <p>{layer.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {currentPage === "home" ? (
        <section className="section-grid section-block manifesto-block">
          <div className="section-heading compact-heading manifesto-heading">
            <span className="section-caption">{copy.manifesto.caption}</span>
            <h2>{copy.manifesto.title}</h2>
            <p>{copy.manifesto.description}</p>
          </div>

          <div className="manifesto-layout manifesto-layout-condensed">
            <div className="manifesto-quote">
              <p>{copy.manifesto.quote}</p>
            </div>

            <div className="manifesto-rail">
              {copy.manifesto.points.map((point) => (
                <article className="manifesto-point" key={point.title}>
                  <strong>{point.title}</strong>
                  <p>{point.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {currentPage === "home" ? (
        <section className="section-grid section-block" id="engines">
          <div className="section-heading">
            <span className="section-caption">{copy.engines.caption}</span>
            <h2>{copy.engines.title}</h2>
            <p>{copy.engines.description}</p>
          </div>

          <div className="engine-layout">
            <article className="panel engine-foundation">
              <div className="panel-header">
                <span>{copy.engines.lens}</span>
                <span className="panel-tag">waveary/</span>
              </div>
              <p>{copy.engines.foundation}</p>
              <div className="engine-foundation-list">
                <span>waveary-core</span>
                <span>waveary-web</span>
                <span>waveary-memory</span>
                <span>waveary-voice</span>
                <span>waveary-mobile</span>
              </div>
            </article>

            <div className="engine-grid">
              {copy.engines.cards.map((engine) => (
                <article className="panel engine-card" key={engine.acronym}>
                  <span className="engine-acronym">{engine.acronym}</span>
                  <h3>{engine.name}</h3>
                  <p>{engine.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {currentPage === "home" ? (
        <section className="section-grid section-block repo-section" id="structure">
          <div className="section-heading">
            <span className="section-caption">{copy.structure.caption}</span>
            <h2>{copy.structure.title}</h2>
            <p>{copy.structure.description}</p>
          </div>

          <div className="repo-layout">
            <div className="repo-tree-card">
              <div className="panel-header">
                <span>{copy.structure.plan}</span>
                <span className="panel-tag">waveary/</span>
              </div>
              <pre>{`waveary/
  waveary-core
  waveary-web
  waveary-mobile
  waveary-memory
  waveary-voice
  waveary-docs`}</pre>
            </div>

            <div className="repo-module-grid">
              {copy.structure.modules.map((module) => (
                <article className="repo-module-card" key={module.name}>
                  <strong>{module.name}</strong>
                  <p>{module.role}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {currentPage === "console" ? (
        <section className="section-grid section-block console-section console-section-shell" id="console">
          <div className="console-shell">
            <div className="console-toolbar">
              <div className="console-toolbar-block">
                <span className="section-caption">{copy.console.caption}</span>
                <strong>{consoleWorkspaceLabelsResolved[activeConsoleWorkspace]}</strong>
                <small>
                  {activeConsoleWorkspace === "provider"
                    ? configuredRuntimeLabel
                    : activeConsoleWorkspace === "sessions"
                      ? `${sessionSummaryLabel}${copy.formatting.sep}${archiveSummaryLabel}`
                      : activeConsoleWorkspace === "care"
                        ? copy.runtime.proactiveCareTag
                        : runtimeStateLabel}
                </small>
              </div>
              <div className="console-toolbar-actions">
                <button
                  className={`button button-secondary ${activeConsoleWorkspace === "provider" ? "console-provider-shortcut-active" : ""}`}
                  onClick={() => setActiveConsoleWorkspace("provider")}
                  type="button"
                >
                  {locale === "zh" ? "模型接入" : "Model setup"}
                </button>
                <button className="button button-primary" onClick={() => navigateTo("chat")} type="button">
                  {locale === "zh" ? "进入对话" : "Open chat"}
                </button>
              </div>
            </div>
            <div className="console-intro">
              <div className="console-masthead">
                <div className="section-heading console-heading">
                  <span className="section-caption">{copy.console.caption}</span>
                  <h2>{copy.console.title}</h2>
                  <p>{copy.console.description}</p>
                </div>

                <div className="console-quick-panel">
                  <span className="mini-heading">{locale === "zh" ? "当前状态" : "Current status"}</span>
                  <strong>{chatReady ? copy.runtime.runtimeReady : copy.runtime.setupRequired}</strong>
                  <p>
                    {locale === "zh"
                      ? "把框架解释留在首页，把配置、会话与运行状态留在这里。当前页面应该像系统桌面，而不是第二个营销首屏。"
                      : "Keep the framework story on the homepage and keep setup, sessions, and runtime state here. This page should read like a system desk, not a second landing hero."}
                  </p>
                  <div className="console-actions">
                    <button className="button button-primary" onClick={() => navigateTo("chat")} type="button">
                      {locale === "zh" ? "进入对话页" : "Open chat"}
                    </button>
                    <button className="button button-secondary" onClick={() => navigateTo("roadmap")} type="button">
                      {locale === "zh" ? "查看路线图" : "View roadmap"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="console-status-board">
                {copy.console.summary.map(([label, description], index) => (
                  <article className="console-summary-card" key={label}>
                    <span className="console-summary-label">{label}</span>
                    <strong>
                      {index === 0
                        ? configuredRuntimeLabel
                        : index === 1
                          ? sessionSummaryLabel
                          : index === 2
                            ? runtimeStateLabel
                            : archiveSummaryLabel}
                    </strong>
                    <p>{description}</p>
                  </article>
                ))}
              </div>

              <div className="console-flow-strip">
                {copy.console.flow.map(([surface, title, description]) => (
                  <article className="console-flow-card" key={surface}>
                    <span>{surface}</span>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </article>
                ))}
              </div>

              <div className="console-workspace-bar">
                {consoleWorkspaceOrder.map((workspace) => (
                  <button
                    className={`console-workspace-tab ${activeConsoleWorkspace === workspace ? "console-workspace-tab-active" : ""}`}
                    key={workspace}
                    onClick={() => setActiveConsoleWorkspace(workspace)}
                    type="button"
                  >
                    <span>{consoleWorkspaceLabelsResolved[workspace]}</span>
                    <small>{consoleWorkspaceDescriptionsResolved[workspace]}</small>
                  </button>
                ))}
              </div>
              <div className="console-status-strip">
                <span>{configuredRuntimeLabel}</span>
                <span>{configuredProviderLabel}</span>
                <span>{configuredModelLabel}</span>
                <span>{sessionSummaryLabel}</span>
                <span>{runtimeStateLabel}</span>
              </div>
            </div>
          </div>
        </section>
        ) : null}

        {currentPage === "console" && activeConsoleWorkspace === "provider" ? (
        <section className="section-grid section-block console-stage console-stage-compact feature-band" id="setup">
          <div className="section-heading console-stage-heading">
            <span className="section-caption">{copy.setup.caption}</span>
            <h2>{copy.setup.title}</h2>
            <p>{copy.setup.description}</p>
          </div>

          <div className="setup-layout console-workspace-stage">
            <div className="panel setup-overview-panel console-workspace-panel">
              <div className="panel-header">
                <span>{copy.setup.sequence}</span>
                <span className="panel-tag">{copy.setup.interactive}</span>
              </div>
              <div className="console-workspace-scroll">
              <ol className="step-list">
                {copy.setup.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>

              <div className="saved-config-block">
                <div className="mini-heading">{copy.setup.savedConfiguration}</div>
                {savedConfig ? (
                  <div className="saved-config-card">
                    <div>
                      <span className="saved-label">{copy.setup.provider}</span>
                      <strong>{savedConfig.provider}</strong>
                    </div>
                    <div>
                      <span className="saved-label">{copy.setup.model}</span>
                      <strong>{savedConfig.model}</strong>
                    </div>
                    <div>
                      <span className="saved-label">{copy.setup.baseUrl}</span>
                      <code>{savedConfig.baseURL}</code>
                    </div>
                  </div>
                ) : (
                  <p className="provider-note">{copy.setup.noSavedConfiguration}</p>
                )}
              </div>

              <div className="saved-config-block">
                <div className="mini-heading">{copy.setup.presetCoverage}</div>
                <div className="provider-list">
                  {presets.map((preset) => (
                    <span className="provider-chip" key={preset.id}>
                      {preset.label}
                    </span>
                  ))}
                </div>
              </div>
              </div>
            </div>

            <div className="panel provider-console-panel console-workspace-panel">
              <div className="panel-header">
                <span>{copy.setup.setupConsole}</span>
                <span className="panel-tag">{copy.setup.localApi}</span>
              </div>
              <div className="console-workspace-scroll">
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
                  <span>{copy.setup.provider}</span>
                  <select value={selectedProvider} onChange={handleProviderChange} disabled={isBusy}>
                    <option value="">{copy.setup.providerPlaceholder}</option>
                    {presets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field form-field-wide">
                  <span>{copy.setup.baseUrl}</span>
                  <input
                    type="text"
                    value={baseURL}
                    onChange={(event) => setBaseURL(event.target.value)}
                    placeholder="https://api.example.com/v1"
                    disabled={isBusy}
                  />
                </label>

                <label className="form-field form-field-wide">
                  <span>{copy.setup.apiKey}</span>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="sk-..."
                    disabled={isBusy}
                  />
                </label>

                <div className="provider-hint">
                  <span className="mini-heading">{copy.setup.selectedPreset}</span>
                  <p>
                    {selectedPreset
                      ? `${selectedPreset.label} ${copy.setup.selectedPresetSuffix}`
                      : copy.setup.selectedPresetFallback}
                  </p>
                </div>
              </div>

              <div className="console-actions">
                <button
                  className="button button-secondary"
                  onClick={() => void loadInitialState()}
                  disabled={loadState === "loading"}
                >
                  {locale === "zh"
                    ? loadState === "loading"
                      ? "正在刷新供应商..."
                      : "刷新供应商"
                    : loadState === "loading"
                      ? "Refreshing providers..."
                      : "Refresh providers"}
                </button>
                <button className="button button-primary" onClick={() => void handleFetchModels()} disabled={!canFetchModels}>
                  {modelsState === "loading" ? copy.setup.fetchingModels : copy.setup.fetchModels}
                </button>
              </div>

              <div className="models-section">
                <div className="mini-heading">{copy.setup.models}</div>
                {models.length > 0 ? (
                  <label className="form-field">
                    <span>{copy.setup.model}</span>
                    <select
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value)}
                      disabled={isBusy}
                    >
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {formatModelOptionLabel(model)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className="provider-note">{copy.setup.modelsHint}</p>
                )}
              </div>

              <div className="console-actions">
                <button className="button button-secondary" onClick={() => void handleSaveConfig()} disabled={!canSaveConfig}>
                  {saveState === "loading" ? copy.setup.saving : copy.setup.saveConfig}
                </button>
              </div>
              </div>
            </div>
          </div>
        </section>
        ) : null}

        {currentPage === "console" && activeConsoleWorkspace === "voice" ? (
        <section className="section-grid section-block console-stage console-stage-compact" id="console-voice">
          <div className="section-heading console-stage-heading">
            <span className="section-caption">{copy.runtime.caption}</span>
            <h2>{locale === "zh" ? "语音控制台" : "Voice console"}</h2>
            <p>
              {locale === "zh"
                ? "把实时对话、语音供应商、声线和本地桥接参数集中在这里，让聊天页只保留陪伴本身。"
                : "Keep realtime conversation, voice routing, presets, and local bridge tuning here so the chat page stays companion-first."}
            </p>
          </div>

          <div className="console-diagnostics-grid console-voice-grid console-workspace-stage">
            <div className="panel provider-console-panel console-workspace-panel">
              <div className="panel-header">
                <span>{locale === "zh" ? "语音路由" : "Voice routing"}</span>
                <span className="panel-tag">{locale === "zh" ? "实时对话" : "Realtime"}</span>
              </div>
              <div className="console-workspace-scroll">
              <p className="provider-note">
                {locale === "zh"
                  ? "聊天模型负责内容，语音模型负责把情绪、距离感和语气读出来。你可以共用聊天供应商，也可以单独接豆包、本地桥或其他兼容端点。"
                  : "Let the chat model handle meaning while the voice path carries emotion, closeness, and delivery. Use the chat provider or attach a dedicated domestic, local, or compatible route."}
              </p>
              <div className="provider-form-grid">
                <label className="form-field">
                  <span>{locale === "zh" ? "语音供应商预设" : "Voice preset"}</span>
                  <select
                    value={selectedVoiceProviderPreset?.id ?? ""}
                    onChange={(event) => void handleApplyVoiceProviderPreset(event.target.value)}
                    disabled={!canAdjustVoiceConfig}
                  >
                    <option value="">{locale === "zh" ? "选择语音供应商" : "Select voice provider"}</option>
                    {voiceProviderPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="provider-hint">
                  <span className="mini-heading">{locale === "zh" ? "目录发现" : "Catalog discovery"}</span>
                  <p>
                    {activeVoiceCatalogNote}
                  </p>
                </div>
              </div>
              <div className="console-actions">
                <button
                  className="button button-secondary"
                  onClick={() => void handleFetchVoiceCatalog()}
                  disabled={!canAdjustVoiceConfig || voiceCatalogState === "loading"}
                  type="button"
                >
                  {voiceCatalogState === "loading"
                    ? locale === "zh"
                      ? "正在获取语音模型..."
                      : "Loading voice catalog..."
                    : locale === "zh"
                      ? "获取语音模型"
                      : "Fetch voice catalog"}
                </button>
                <button
                  className={`button button-secondary ${voiceConversationMode ? "chat-voice-button-active" : ""}`}
                  onClick={() => handleToggleSpeechInput()}
                  disabled={
                    !chatReady ||
                    chatState === "loading" ||
                    speechInputState === "processing" ||
                    speechInputState === "unsupported"
                  }
                  type="button"
                >
                  {voiceConversationMode
                    ? locale === "zh"
                      ? "结束实时对话"
                      : "End live chat"
                    : locale === "zh"
                      ? "开始实时对话"
                      : "Start live chat"}
                </button>
                <button className="button button-secondary" onClick={() => navigateTo("chat")} type="button">
                  {locale === "zh" ? "进入对话页" : "Open chat page"}
                </button>
              </div>
              {voiceConfigState === "error" ? (
                <div className="status-banner status-banner-error">
                  {locale === "zh" ? "语音配置加载或保存失败。" : "Voice configuration failed to load or save."}
                </div>
              ) : null}
              {renderVoiceConfigControls("console")}
              </div>
            </div>

            <div className="panel insight-panel voice-console-sidepanel console-workspace-panel">
              <div className="panel-header">
                <span>{locale === "zh" ? "当前语音状态" : "Current voice state"}</span>
                <span className="panel-tag">{locale === "zh" ? "状态 + 说明" : "State + guide"}</span>
              </div>
              <div className="console-workspace-scroll insight-stack">
                <div className="signal-metrics">
                  <div className="signal-metric-card">
                    <span>{locale === "zh" ? "播放" : "Playback"}</span>
                    <strong>{voicePlaybackState}</strong>
                  </div>
                  <div className="signal-metric-card">
                    <span>{locale === "zh" ? "麦克风" : "Mic"}</span>
                    <strong>{speechInputState}</strong>
                  </div>
                  <div className="signal-metric-card">
                    <span>{locale === "zh" ? "来源" : "Source"}</span>
                    <strong>
                      {usesDedicatedVoiceProvider
                        ? voiceStatusProviderLabel
                        : locale === "zh"
                          ? "共享"
                          : "shared"}
                    </strong>
                  </div>
                  <div className="signal-metric-card">
                    <span>{locale === "zh" ? "声线" : "Voice"}</span>
                    <strong>{voiceConfig?.voice || "-"}</strong>
                  </div>
                  <div className="signal-metric-card">
                    <span>{locale === "zh" ? "音色模式" : "Voice field"}</span>
                    <strong>{voiceFieldMode}</strong>
                  </div>
                  <div className="signal-metric-card">
                    <span>{locale === "zh" ? "供应商类型" : "Provider type"}</span>
                    <strong>{voiceStatusProviderType}</strong>
                  </div>
                </div>
                <div className="insight-card">
                  <div className="mini-heading">{locale === "zh" ? "状态说明" : "Status"}</div>
                  <p>
                    {voiceStatusMessage || voiceRoutingDetailMessage}
                  </p>
                </div>
                <div className="insight-card">
                  <div className="mini-heading">{locale === "zh" ? "路由诊断" : "Routing"}</div>
                  <p>
                    {locale === "zh"
                      ? `当前目标：${voiceRoutingTargetLabel} · ${voiceRoutingReadyLabel}`
                      : `Current target: ${voiceRoutingTargetLabel} · ${voiceRoutingReadyLabel}`}
                  </p>
                  <p>
                    {locale === "zh"
                      ? `缺失字段：${voiceRoutingMissingFieldsLabel}`
                      : `Missing fields: ${voiceRoutingMissingFieldsLabel}`}
                  </p>
                  {voiceRoutingStatus?.attemptedProviderAudio && voiceRoutingStatus.fallbackReason ? (
                    <p>
                      {locale === "zh"
                        ? `本次 fallback 原因：${voiceRoutingStatus.fallbackReason}`
                        : `Last fallback reason: ${formattedVoiceFallbackReason ?? voiceRoutingStatus.fallbackReason}`}
                    </p>
                  ) : null}
                </div>
                <div className="insight-card">
                  <div className="mini-heading">{locale === "zh" ? "麦克风说明" : "Microphone"}</div>
                  <p>
                    {speechInputStatusMessage ||
                      (speechInputState === "unsupported"
                        ? locale === "zh"
                          ? "当前浏览器还不支持语音输入。"
                          : "This browser does not support speech input."
                        : locale === "zh"
                          ? "实时对话开启后，Waveary 会直接监听你的下一句。"
                          : "Once realtime mode is on, Waveary listens for your next line directly.")}
                  </p>
                </div>
                <div className="insight-card voice-guide-card">
                  <div className="mini-heading">{locale === "zh" ? "当前面板在做什么" : "Current guidance"}</div>
                  <p>{voiceStatusGuidanceNote}</p>
                </div>
                <div className="insight-card voice-guide-card">
                  <div className="mini-heading">{locale === "zh" ? "填写建议" : "How to fill it"}</div>
                  <ul className="voice-guide-list">
                    <li>
                      {usesDedicatedVoiceProvider
                        ? locale === "zh"
                          ? "先选供应商预设，再补全这一家真正需要的字段。"
                          : "Start from a provider preset, then fill only the fields this vendor actually needs."
                        : locale === "zh"
                          ? "共享模式下不用重复配置第二套供应商。"
                          : "In shared mode, you do not need to configure a second vendor."}
                    </li>
                    <li>
                      {voiceFieldMode === "select"
                        ? locale === "zh"
                          ? "当前供应商支持下拉音色选择。"
                          : "This provider can use a selectable voice list."
                        : locale === "zh"
                          ? "当前供应商的音色要手填 voice / speaker ID。"
                          : "This provider expects a manual voice or speaker ID."}
                    </li>
                    <li>
                      {voiceStatusProviderType === "local"
                        ? locale === "zh"
                          ? "本地桥接请保证 Base URL、Endpoint 和引擎字段与你的本地服务一致。"
                          : "For local bridges, make sure Base URL, endpoint, and engine all match your local service."
                        : voiceStatusProviderType === "gemini"
                          ? locale === "zh"
                            ? "Gemini TTS 使用官方预置音色名和 Gemini TTS 模型，当前麦克风转写仍不会走 Gemini。"
                            : selectedVoiceProviderPresetId === "gemini-micu"
                              ? "Gemini over Micu relay currently needs the Micu-recognized model names instead of the official `*-preview-tts` aliases. Microphone transcription still does not route through Gemini."
                              : "Gemini TTS uses official prebuilt voice names and Gemini TTS models. Microphone transcription does not route through Gemini yet."
                        : voiceStatusProviderType === "doubao"
                          ? locale === "zh"
                            ? "豆包还需要 API Key 和 Resource ID，缺一项都跑不通。"
                            : "Doubao also needs API key and resource ID; missing either will break the route."
                          : locale === "zh"
                            ? "兼容供应商通常可以发现模型，但音色是否共享目录取决于这家服务本身。"
                            : "Compatible vendors can often discover models, but shared voice directories depend on the vendor."}
                    </li>
                  </ul>
                </div>
                {selectedVoicePreset ? (
                  <div className="insight-card">
                    <div className="mini-heading">{locale === "zh" ? "当前预设" : "Current preset"}</div>
                    <p>{selectedVoicePreset.label}</p>
                    <p className="provider-note">{selectedVoicePreset.description}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
        ) : null}

        {currentPage === "console" &&
        activeConsoleWorkspace !== "provider" &&
        activeConsoleWorkspace !== "voice" ? (
        <section className="section-grid section-block console-stage console-stage-compact" id="console-manage">
          <div className="section-heading console-stage-heading">
            <span className="section-caption">{copy.runtime.caption}</span>
            <h2>{locale === "zh" ? "会话与持久化控制台" : "Session and persistence console"}</h2>
            <p>
              {locale === "zh"
                ? "这里保留会话管理、持久化切换、导入导出与运行诊断，让对话页面本身保持更轻、更安静。"
                : "Keep session management, persistence switching, import/export, and runtime diagnostics here so the conversation page itself stays lighter and more focused."}
            </p>
          </div>

          {activeConsoleWorkspace === "sessions" ? (
          <div className="console-workspace-stage console-workspace-stage-single">
          <div className="panel session-panel console-workspace-panel console-workspace-panel-full">
            <div className="panel-header">
              <span>{copy.runtime.sessionLayer}</span>
              <span className="panel-tag">{copy.runtime.sessionTag}</span>
            </div>

            <div className="session-panel-grid console-workspace-scroll">
              <div className="session-list console-subpanel">
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
                          {isMain ? copy.runtime.main : copy.runtime.session}
                        </span>
                      </div>
                      <div className="session-card-meta">
                        <span>{`${session.messageCount} ${copy.runtime.messages}`}</span>
                        <span>{formatSessionTimestamp(session.updatedAt, locale)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="session-controls">
                <div className="session-control-card">
                  <div className="mini-heading">{copy.runtime.persistence}</div>
                  <div className="session-active-summary">
                    <strong>{persistenceStatus ? persistenceStatus.backend.toUpperCase() : copy.runtime.loading}</strong>
                    <span>
                      {persistenceStatus
                        ? `${copy.runtime.currentStore} ${persistenceStatus.storageLabel}`
                        : copy.runtime.loadingPersistence}
                    </span>
                  </div>

                  {persistenceStatus ? (
                    <div className="persistence-status-grid">
                      <div className="persistence-status-card">
                        <span className="mini-heading">{copy.runtime.lastSync}</span>
                        <strong>
                          {persistenceStatus.lastSync.switchedAt
                            ? `${formatPersistenceBackendLabel(persistenceStatus.lastSync.fromBackend, locale)} -> ${formatPersistenceBackendLabel(
                                persistenceStatus.lastSync.toBackend,
                                locale
                              )}`
                            : copy.runtime.noSwitch}
                        </strong>
                        <span>
                          {persistenceStatus.lastSync.switchedAt
                            ? `${formatSessionTimestamp(persistenceStatus.lastSync.switchedAt, locale)}${copy.formatting.sep}${persistenceStatus.lastSync.synchronizedSessionCount} ${copy.runtime.sessionsSynced}`
                            : copy.runtime.noMigration}
                        </span>
                      </div>

                      {persistenceStatus.backendDetails.map((detail) => (
                        <div className="persistence-status-card" key={detail.backend}>
                          <div className="persistence-status-topline">
                            <strong>{formatPersistenceBackendLabel(detail.backend, locale)}</strong>
                            <span className={`persistence-badge persistence-badge-${detail.syncState}`}>
                              {formatPersistenceSyncState(detail.syncState, locale)}
                            </span>
                          </div>
                          <span>{detail.storageLabel}</span>
                          <span>
                            {detail.exists
                              ? `${detail.sessionCount} ${copy.runtime.sessionsUnit}${copy.formatting.sep}${
                                  detail.latestUpdatedAt
                                    ? `${copy.runtime.latest} ${formatSessionTimestamp(detail.latestUpdatedAt, locale)}`
                                    : copy.runtime.noWrites
                                }`
                              : copy.runtime.localStoreMissing}
                          </span>
                          {detail.backend !== persistenceStatus.backend ? (
                            <span>
                              {detail.differingSessionCount > 0
                                ? locale === "zh"
                                  ? `${detail.differingSessionCount} 个会话与当前激活后端不同。`
                                  : `${detail.differingSessionCount} sessions differ from the active backend.`
                                : copy.runtime.noSessionDiff}
                            </span>
                          ) : (
                            <span>{copy.runtime.activeBackendDescription}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <label className="form-field">
                    <span>{copy.runtime.backend}</span>
                    <select
                      value={selectedPersistenceBackend}
                      onChange={(event) => setSelectedPersistenceBackend(event.target.value as ChatPersistenceBackend)}
                      disabled={!persistenceStatus || persistenceState === "loading"}
                    >
                      {(persistenceStatus?.availableBackends ?? ["file", "sqlite"]).map((backend) => (
                        <option key={backend} value={backend}>
                          {formatPersistenceBackendLabel(backend, locale)}
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
                      {persistenceState === "loading" ? copy.runtime.switching : copy.runtime.switchBackend}
                    </button>
                  </div>

                  {alternateBackendStatus ? (
                    <p className="provider-note persistence-note">
                      {alternateBackendStatus.syncState === "in-sync"
                        ? locale === "zh"
                          ? `${formatPersistenceBackendLabel(alternateBackendStatus.backend, locale)} 已与当前激活后端保持一致。`
                          : `${formatPersistenceBackendLabel(alternateBackendStatus.backend, locale)} is aligned with the active backend.`
                        : locale === "zh"
                          ? `${formatPersistenceBackendLabel(alternateBackendStatus.backend, locale)} 当前状态为 ${formatPersistenceSyncState(
                              alternateBackendStatus.syncState,
                              locale
                            )}，共有 ${alternateBackendStatus.differingSessionCount} 个差异会话。`
                          : `${formatPersistenceBackendLabel(alternateBackendStatus.backend, locale)} is ${formatPersistenceSyncState(
                              alternateBackendStatus.syncState,
                              locale
                            ).toLowerCase()} with ${alternateBackendStatus.differingSessionCount} differing sessions.`}
                    </p>
                  ) : null}
                </div>

                <div className="session-control-card">
                  <div className="mini-heading">{copy.runtime.permissions}</div>
                  <p className="provider-note">{copy.runtime.permissionsDescription}</p>
                  <p className="provider-note">{copy.runtime.permissionsHint}</p>

                  <div className="permission-grid">
                    {(
                      [
                        ["browserNotifications", copy.runtime.permissionBrowserNotifications],
                        ["proactiveNotifications", copy.runtime.permissionProactiveNotifications],
                        ["timeAwareness", copy.runtime.permissionTimeAwareness],
                        ["desktopPresence", copy.runtime.permissionDesktopPresence],
                        ["localActions", copy.runtime.permissionLocalActions]
                      ] as const
                    ).map(([key, label]) => (
                      <div className="permission-card" key={key}>
                        <strong>{label}</strong>
                        <div className="permission-level-group">
                          {(
                            [
                              ["deny", copy.runtime.permissionDeny],
                              ["ask", copy.runtime.permissionAsk],
                              ["allow", copy.runtime.permissionAllow]
                            ] as const
                          ).map(([value, valueLabel]) => (
                            <label className="permission-choice" key={value}>
                              <input
                                type="radio"
                                name={`permission-${key}`}
                                value={value}
                                checked={permissionProfile[key] === value}
                                onChange={() => handlePermissionLevelChange(key, value)}
                              />
                              <span>{valueLabel}</span>
                            </label>
                          ))}
                        </div>
                        {key === "browserNotifications" ? (
                          <span className="provider-note">
                            {copy.runtime.notificationPermission}
                            {copy.formatting.sep}
                            {formatBrowserNotificationPermission(browserNotificationPermission, locale)}
                          </span>
                        ) : (
                          <span className="provider-note">{copy.runtime.permissionNotImplemented}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {permissionProfile.browserNotifications !== "deny" &&
                  browserNotificationPermission !== "granted" &&
                  browserNotificationPermission !== "unsupported" ? (
                    <div className="console-actions">
                      <button
                        className="button button-secondary"
                        onClick={() => void handleRequestNotificationPermission()}
                        disabled={notificationPermissionState === "loading"}
                        type="button"
                      >
                        {notificationPermissionState === "loading"
                          ? copy.runtime.requestingNotificationPermission
                          : copy.runtime.requestNotificationPermission}
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="session-control-card">
                  <div className="mini-heading">{copy.runtime.createSession}</div>
                  <label className="form-field">
                    <span>{copy.runtime.newSessionTitle}</span>
                    <input
                      type="text"
                      value={newSessionTitle}
                      onChange={(event) => setNewSessionTitle(event.target.value)}
                      placeholder={copy.runtime.newSessionPlaceholder}
                    />
                  </label>
                  <div className="console-actions">
                    <button
                      className="button button-secondary"
                      onClick={() => void handleCreateSession()}
                      disabled={!canCreateSession}
                      type="button"
                    >
                      {copy.runtime.createSession}
                    </button>
                  </div>
                </div>

                <div className="session-control-card">
                  <div className="mini-heading">{copy.runtime.importSession}</div>
                  {sessionPackageReference ? (
                    <div className="session-reference-card">
                      <div className="mini-heading">{copy.runtime.packageRules}</div>
                      <p className="provider-note session-reference-copy">{sessionPackageReference.importRule}</p>
                      <p className="provider-note session-reference-copy">
                        {copy.runtime.currentSchema} <code>{sessionPackageReference.currentSchemaVersion}</code>
                      </p>
                      <div className="session-reference-grid">
                        <div>
                          <strong>{copy.runtime.topLevelFields}</strong>
                          <ul className="session-reference-list">
                            {sessionPackageReference.topLevelFields.map((field) => (
                              <li key={field}>
                                <code>{field}</code>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong>{copy.runtime.requiredArrays}</strong>
                          <ul className="session-reference-list">
                            {sessionPackageReference.requiredSnapshotCollections.map((field) => (
                              <li key={field}>
                                <code>{field}</code>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="session-reference-links">
                        <span>{sessionPackageReference.docs.formatPath}</span>
                        <span>{sessionPackageReference.docs.samplePath}</span>
                      </div>
                    </div>
                  ) : null}

                  <input
                    ref={sessionImportFileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="session-import-file-input"
                    onChange={(event) => void handleImportSessionFile(event)}
                  />

                  <label className="form-field">
                    <span>{copy.runtime.importedSessionTitle}</span>
                    <input
                      type="text"
                      value={sessionImportTitle}
                      onChange={(event) => setSessionImportTitle(event.target.value)}
                      placeholder={copy.runtime.importedSessionPlaceholder}
                    />
                  </label>

                  <label className="form-field">
                    <span>{copy.runtime.exportedJson}</span>
                    <textarea
                      className="session-import-textarea"
                      value={sessionImportJson}
                      onChange={(event) => setSessionImportJson(event.target.value)}
                      placeholder={copy.runtime.exportedJsonPlaceholder}
                    />
                  </label>

                  <div className="console-actions">
                    <button
                      className="button button-secondary"
                      onClick={() => sessionImportFileInputRef.current?.click()}
                      type="button"
                    >
                      {copy.runtime.chooseJsonFile}
                    </button>
                    <button
                      className="button button-secondary"
                      onClick={handleLoadSampleSession}
                      disabled={!canLoadSampleSession}
                      type="button"
                    >
                      {copy.runtime.loadSample}
                    </button>
                    <button
                      className="button button-secondary"
                      onClick={() => void handleImportSession()}
                      disabled={!canImportSession}
                      type="button"
                    >
                      {sessionImportState === "loading" ? copy.runtime.importing : copy.runtime.importAsNew}
                    </button>
                  </div>

                  {sessionImportErrors.length > 0 ? (
                    <div className="session-import-error-card">
                      <div className="mini-heading">{copy.runtime.importDiagnostics}</div>
                      <ul className="session-import-error-list">
                        {sessionImportErrors.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="session-control-card">
                  <div className="mini-heading">{copy.runtime.manageSession}</div>
                  {activeSession ? (
                    <>
                      <div className="session-active-summary">
                        <strong>{activeSession.title}</strong>
                        <span>
                          {activeSession.sessionId === defaultSessionId
                            ? copy.runtime.mainSessionDescription
                            : copy.runtime.optionalSessionDescription}
                        </span>
                      </div>

                      <label className="form-field">
                        <span>{copy.runtime.sessionTitle}</span>
                        <input
                          type="text"
                          value={sessionRenameTitle}
                          onChange={(event) => setSessionRenameTitle(event.target.value)}
                          placeholder={copy.runtime.renamePlaceholder}
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
                          {sessionExportState === "loading" ? copy.runtime.exporting : copy.runtime.exportSession}
                        </button>
                        <button
                          className="button button-secondary"
                          onClick={() => void handleResetSession()}
                          disabled={!activeSession.sessionId}
                          type="button"
                        >
                          {copy.runtime.resetSession}
                        </button>
                        <button
                          className="button button-secondary"
                          onClick={() => void handleRenameSession()}
                          disabled={!canRenameSession}
                          type="button"
                        >
                          {copy.runtime.renameSession}
                        </button>
                        <button
                          className="button button-danger"
                          onClick={() => void handleDeleteSession()}
                          disabled={activeSession.sessionId === defaultSessionId}
                          type="button"
                        >
                          {copy.runtime.deleteSession}
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="provider-note">{copy.runtime.noLocalSession}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
          ) : null}

          {activeConsoleWorkspace === "care" ? (
          <div className="console-diagnostics-grid console-workspace-stage">
            <div className="panel insight-panel console-workspace-panel console-workspace-panel-full">
              <div className="panel-header">
                <span>{copy.runtime.proactiveCare}</span>
                <span className="panel-tag">{copy.runtime.proactiveCareTag}</span>
              </div>

              <div className="console-workspace-scroll insight-stack">
                <p className="provider-note">{copy.runtime.proactiveCareDescription}</p>

                {proactiveCarePolicy && proactiveCareState ? (
                  <>
                    <div className="proactive-care-grid">
                      <label className="form-field proactive-checkbox-field">
                        <span>{copy.runtime.proactiveEnabled}</span>
                        <label className="proactive-toggle">
                          <input
                            type="checkbox"
                            checked={proactiveCarePolicy.enabled}
                            onChange={(event) =>
                              setProactiveCarePolicy((current) =>
                                current
                                  ? {
                                      ...current,
                                      enabled: event.target.checked
                                    }
                                  : current
                              )
                            }
                          />
                          <span>{proactiveCarePolicy.enabled ? copy.runtime.yes : copy.runtime.no}</span>
                        </label>
                      </label>

                      <label className="form-field">
                        <span>{copy.runtime.quietHoursStart}</span>
                        <input
                          type="time"
                          value={proactiveCarePolicy.quietHoursStart ?? ""}
                          onChange={(event) =>
                            setProactiveCarePolicy((current) =>
                              current
                                ? patchOptionalTimeField(current, "quietHoursStart", event.target.value)
                                : current
                            )
                          }
                        />
                      </label>

                      <label className="form-field">
                        <span>{copy.runtime.quietHoursEnd}</span>
                        <input
                          type="time"
                          value={proactiveCarePolicy.quietHoursEnd ?? ""}
                          onChange={(event) =>
                            setProactiveCarePolicy((current) =>
                              current
                                ? patchOptionalTimeField(current, "quietHoursEnd", event.target.value)
                                : current
                            )
                          }
                        />
                      </label>

                      <label className="form-field">
                        <span>{copy.runtime.maxDailyReachouts}</span>
                        <input
                          type="number"
                          min={0}
                          value={proactiveCarePolicy.maxDailyReachouts}
                          onChange={(event) =>
                            setProactiveCarePolicy((current) =>
                              current
                                ? {
                                    ...current,
                                    maxDailyReachouts: Math.max(0, Number(event.target.value || 0))
                                  }
                                : current
                            )
                          }
                        />
                      </label>

                      <label className="form-field proactive-checkbox-field">
                        <span>{copy.runtime.allowMealCare}</span>
                        <label className="proactive-toggle">
                          <input
                            type="checkbox"
                            checked={proactiveCarePolicy.allowMealCare}
                            onChange={(event) =>
                              setProactiveCarePolicy((current) =>
                                current
                                  ? {
                                      ...current,
                                      allowMealCare: event.target.checked
                                    }
                                  : current
                              )
                            }
                          />
                          <span>{proactiveCarePolicy.allowMealCare ? copy.runtime.yes : copy.runtime.no}</span>
                        </label>
                      </label>

                      <label className="form-field proactive-checkbox-field">
                        <span>{copy.runtime.allowSleepCare}</span>
                        <label className="proactive-toggle">
                          <input
                            type="checkbox"
                            checked={proactiveCarePolicy.allowSleepCare}
                            onChange={(event) =>
                              setProactiveCarePolicy((current) =>
                                current
                                  ? {
                                      ...current,
                                      allowSleepCare: event.target.checked
                                    }
                                  : current
                              )
                            }
                          />
                          <span>{proactiveCarePolicy.allowSleepCare ? copy.runtime.yes : copy.runtime.no}</span>
                        </label>
                      </label>

                      <label className="form-field proactive-checkbox-field">
                        <span>{copy.runtime.allowAbsenceCheckins}</span>
                        <label className="proactive-toggle">
                          <input
                            type="checkbox"
                            checked={proactiveCarePolicy.allowAbsenceCheckins}
                            onChange={(event) =>
                              setProactiveCarePolicy((current) =>
                                current
                                  ? {
                                      ...current,
                                      allowAbsenceCheckins: event.target.checked
                                    }
                                  : current
                              )
                            }
                          />
                          <span>{proactiveCarePolicy.allowAbsenceCheckins ? copy.runtime.yes : copy.runtime.no}</span>
                        </label>
                      </label>

                      <label className="form-field">
                        <span>{copy.runtime.dailyReachoutsSent}</span>
                        <input
                          type="number"
                          min={0}
                          value={proactiveCareState.dailyReachoutsSent}
                          onChange={(event) =>
                            setProactiveCareState((current) =>
                              current
                                ? {
                                    ...current,
                                    dailyReachoutsSent: Math.max(0, Number(event.target.value || 0))
                                  }
                                : current
                            )
                          }
                        />
                      </label>

                      <label className="form-field">
                        <span>{copy.runtime.unansweredReachoutCount}</span>
                        <input
                          type="number"
                          min={0}
                          value={proactiveCareState.unansweredReachoutCount}
                          onChange={(event) =>
                            setProactiveCareState((current) =>
                              current
                                ? {
                                    ...current,
                                    unansweredReachoutCount: Math.max(0, Number(event.target.value || 0))
                                  }
                                : current
                            )
                          }
                        />
                      </label>
                    </div>

                    <div className="session-reference-card proactive-state-card">
                      <strong>{copy.runtime.lastReachOutAt}</strong>
                      <span>
                        {proactiveCareState.lastReachOutAt
                          ? formatSessionTimestamp(proactiveCareState.lastReachOutAt, locale)
                          : copy.runtime.noReachOutYet}
                      </span>
                    </div>

                    <div className="session-reference-card proactive-state-card">
                      <strong>{copy.runtime.browserNotifications}</strong>
                      <span>
                        {copy.runtime.notificationPermission}
                        {copy.formatting.sep}
                        {formatBrowserNotificationPermission(browserNotificationPermission, locale)}
                      </span>
                      <span>{copy.runtime.notificationHint}</span>
                      <label className="proactive-toggle">
                        <input
                          type="checkbox"
                          checked={proactiveNotificationEnabled}
                          onChange={(event) => {
                            const enabled = event.target.checked;
                            setProactiveNotificationEnabled(enabled);
                            setPermissionProfile((current) => ({
                              ...current,
                              proactiveNotifications: enabled ? "allow" : "deny"
                            }));
                          }}
                          disabled={
                            browserNotificationPermission === "unsupported" ||
                            permissionProfile.browserNotifications === "deny"
                          }
                        />
                        <span>
                          {copy.runtime.notificationAutoDelivery}
                          {copy.formatting.sep}
                          {proactiveNotificationEnabled ? copy.runtime.yes : copy.runtime.no}
                        </span>
                      </label>
                      {browserNotificationPermission !== "granted" &&
                      browserNotificationPermission !== "unsupported" ? (
                        <button
                          className="button button-secondary"
                          onClick={() => void handleRequestNotificationPermission()}
                          disabled={notificationPermissionState === "loading"}
                          type="button"
                        >
                          {notificationPermissionState === "loading"
                            ? copy.runtime.requestingNotificationPermission
                            : copy.runtime.requestNotificationPermission}
                        </button>
                      ) : null}
                    </div>

                    <div className="session-reference-card proactive-state-card">
                      <strong>{copy.runtime.proactiveLocalLoop}</strong>
                      <span>{copy.runtime.proactiveLocalLoopHint}</span>
                      <label className="proactive-toggle">
                        <input
                          type="checkbox"
                          checked={proactiveAutoCheckEnabled}
                          onChange={(event) => setProactiveAutoCheckEnabled(event.target.checked)}
                          disabled={
                            permissionProfile.proactiveNotifications !== "allow" ||
                            !savedConfig
                          }
                        />
                        <span>
                          {copy.runtime.proactiveLocalLoopEnabled}
                          {copy.formatting.sep}
                          {proactiveAutoCheckEnabled ? copy.runtime.yes : copy.runtime.no}
                        </span>
                      </label>
                      <label className="form-field">
                        <span>{copy.runtime.proactiveLocalLoopInterval}</span>
                        <input
                          type="number"
                          min={5}
                          step={5}
                          value={proactiveAutoCheckIntervalMinutes}
                          onChange={(event) =>
                            setProactiveAutoCheckIntervalMinutes(
                              Math.max(5, Number(event.target.value || DEFAULT_PROACTIVE_AUTO_CHECK_INTERVAL_MINUTES))
                            )
                          }
                          disabled={!proactiveAutoCheckEnabled}
                        />
                      </label>
                      <span>
                        {copy.runtime.proactiveLocalLoopLastRun}
                        {copy.formatting.sep}
                        {proactiveAutoCheckLastRunAt
                          ? formatSessionTimestamp(proactiveAutoCheckLastRunAt, locale)
                          : copy.runtime.proactiveLocalLoopNever}
                      </span>
                      <span>
                        {copy.runtime.proactiveLocalLoopOutcome}
                        {copy.formatting.sep}
                        {formatProactiveAutoCheckOutcome(proactiveAutoCheckLastOutcome, locale)}
                      </span>
                    </div>

                    <div className="console-actions">
                      <button
                        className="button button-secondary"
                        onClick={() => void handleSaveProactiveCareSettings()}
                        disabled={!canSaveProactiveSettings}
                        type="button"
                      >
                        {proactiveSaveState === "loading"
                          ? copy.runtime.savingProactiveSettings
                          : copy.runtime.saveProactiveSettings}
                      </button>
                      <button
                        className="button button-secondary"
                        onClick={() => void handleEvaluateProactiveCare()}
                        disabled={!canEvaluateProactive}
                        type="button"
                      >
                        {proactiveEvaluateState === "loading"
                          ? copy.runtime.evaluatingProactive
                          : copy.runtime.evaluateProactiveNow}
                      </button>
                    </div>

                    {proactiveDecision ? (
                      (() => {
                        const decisionSummary =
                          proactiveDraft ??
                          buildProactiveMessageDraft(
                            proactiveDecision,
                            locale,
                            getCurrentDecisionDayPart(permissionProfile)
                          );

                        return (
                          <div
                            className={`insight-card proactive-decision-card ${proactiveDecision.shouldReachOut ? "proactive-decision-card-positive" : "proactive-decision-card-blocked"}`}
                          >
                            <div className="proactive-decision-header">
                              <div className="mini-heading">{copy.runtime.proactiveDecision}</div>
                              <span
                                className={`proactive-decision-badge ${proactiveDecision.shouldReachOut ? "proactive-decision-badge-positive" : "proactive-decision-badge-blocked"}`}
                              >
                                {proactiveDecision.shouldReachOut ? copy.runtime.proactiveShouldReachOut : copy.runtime.proactiveReasons}
                              </span>
                            </div>
                            <div className="proactive-decision-summary">
                              <strong>{decisionSummary.title}</strong>
                              <p>{decisionSummary.body}</p>
                            </div>
                            <div className="proactive-decision-grid">
                              <div>
                                <span>{copy.runtime.proactiveShouldReachOut}</span>
                                <strong>{proactiveDecision.shouldReachOut ? copy.runtime.yes : copy.runtime.no}</strong>
                              </div>
                              <div>
                                <span>{copy.runtime.proactiveIntent}</span>
                                <strong>{formatProactiveIntent(proactiveDecision.intent, locale)}</strong>
                              </div>
                              <div>
                                <span>{copy.runtime.proactiveUrgency}</span>
                                <strong>{formatProactiveUrgency(proactiveDecision.urgency, locale)}</strong>
                              </div>
                              <div>
                                <span>{copy.runtime.proactiveTone}</span>
                                <strong>{formatProactiveDraftTone(decisionSummary.tone, locale)}</strong>
                              </div>
                              <div>
                                <span>{copy.runtime.proactiveSuggestedDelay}</span>
                                <strong>
                                  {typeof proactiveDecision.suggestedDelayMinutes === "number"
                                    ? `${proactiveDecision.suggestedDelayMinutes} ${copy.runtime.minutes}`
                                    : "-"}
                                </strong>
                              </div>
                            </div>
                            <div className="proactive-reasons-block">
                              <strong>{copy.runtime.proactiveSuggestedMessage}</strong>
                              <p>{decisionSummary.suggestedMessage}</p>
                            </div>
                            <div className="proactive-reasons-block">
                              <strong>{copy.runtime.proactiveReasons}</strong>
                              {proactiveDecision.reasons.length > 0 ? (
                                <ul className="insight-list">
                                  {proactiveDecision.reasons.map((reason) => (
                                    <li key={reason}>{formatProactiveReason(reason, locale)}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p>-</p>
                              )}
                            </div>
                            <p>
                              {copy.runtime.proactiveEvaluatedAt}
                              {copy.formatting.sep}
                              {formatSessionTimestamp(proactiveDecision.evaluatedAt, locale)}
                            </p>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="session-reference-card proactive-state-card">
                        <span>{copy.runtime.proactiveNoDecision}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-chat-state">{copy.runtime.noLocalSession}</div>
                )}
              </div>
            </div>
          </div>
          ) : null}

          {activeConsoleWorkspace === "runtime" ? (
          <div className="console-diagnostics-grid console-workspace-stage">
            <div className="panel insight-panel console-workspace-panel">
              <div className="panel-header">
                <span>{copy.runtime.signals}</span>
                <span className="panel-tag">{copy.runtime.signalsTag}</span>
              </div>

              {chatInsights ? (
                <div className="console-workspace-scroll insight-stack">
                  <div className="signal-metrics">
                    <div className="signal-metric-card">
                      <span>{copy.runtime.relationshipStage}</span>
                      <strong>{chatInsights.relationship.stage}</strong>
                    </div>
                    <div className="signal-metric-card">
                      <span>{copy.runtime.affinity}</span>
                      <strong>{chatInsights.relationship.affinityScore.toFixed(2)}</strong>
                    </div>
                    <div className="signal-metric-card">
                      <span>{copy.runtime.trust}</span>
                      <strong>{chatInsights.relationship.trustScore.toFixed(2)}</strong>
                    </div>
                    <div className="signal-metric-card">
                      <span>{copy.runtime.stability}</span>
                      <strong>{chatInsights.relationship.stabilityScore.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="insight-card">
                    <div className="mini-heading">{copy.runtime.emotion}</div>
                    <p>
                      {chatInsights.emotion
                        ? `${chatInsights.emotion.primaryEmotion} (${chatInsights.emotion.intensity.toFixed(2)})`
                        : copy.runtime.noEmotion}
                    </p>
                  </div>

                  <div className="insight-card">
                    <div className="mini-heading">{copy.runtime.recalledMemories}</div>
                    {chatInsights.recalledMemories.length > 0 ? (
                      <ul className="insight-list">
                        {chatInsights.recalledMemories.map((memory) => (
                          <li key={memory}>{memory}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{copy.runtime.noRecalled}</p>
                    )}
                  </div>

                  <div className="insight-card">
                    <div className="mini-heading">{copy.runtime.storedMemories}</div>
                    {chatInsights.storedMemories.length > 0 ? (
                      <ul className="insight-list">
                        {chatInsights.storedMemories.map((memory) => (
                          <li key={memory}>{memory}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{copy.runtime.noStored}</p>
                    )}
                  </div>

                  <div className="insight-card">
                    <div className="mini-heading">{copy.runtime.timeline}</div>
                    {chatInsights.timeline.length > 0 ? (
                      <ul className="insight-list">
                        {chatInsights.timeline.map((event) => (
                          <li key={`${event.eventTime}-${event.title}`}>
                            <strong>{event.title}</strong>
                            <span>{`${event.type}${copy.formatting.sep}${event.eventTime}`}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{copy.runtime.noTimeline}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-chat-state">{copy.runtime.runtimeHint}</div>
              )}
            </div>

            <div className="panel console-export-panel console-workspace-panel">
              <div className="panel-header">
                <span>{copy.runtime.sessionExport}</span>
                <span className="panel-tag">{copy.runtime.structuredJson}</span>
              </div>
              <div className="console-workspace-scroll">
              {sessionExportJson ? (
                <>
                  <p className="provider-note">{copy.runtime.exportDescription}</p>
                  {sessionPackageReference ? (
                    <div className="session-export-callout">
                      <strong>{copy.runtime.importSafety}</strong>
                      <span>
                        {sessionPackageReference.importRule} {copy.runtime.currentSchemaShort} {sessionPackageReference.currentSchemaVersion}
                      </span>
                    </div>
                  ) : null}
                  <pre className="session-export-block">
                    <code>{sessionExportJson}</code>
                  </pre>
                </>
              ) : (
                <p className="provider-note">
                  {locale === "zh"
                    ? "从上方“管理会话”卡片导出当前会话后，结构化 JSON 会显示在这里。"
                    : "Export the active session from the manage-session card above and the structured JSON will appear here."}
                </p>
              )}
              </div>
            </div>
          </div>
          ) : null}
        </section>
        ) : null}

        {currentPage === "chat" ? (
        <section className="section-grid section-block chat-page-section" id="chat">
          <div className="chat-page-shell">
            <div className="chat-page-header">
              <div className="section-heading compact-heading chat-page-heading">
                <span className="section-caption">{copy.runtime.caption}</span>
                <h2>{locale === "zh" ? "对话页面" : "Conversation"}</h2>
                <p>
                  {locale === "zh"
                    ? "这里只保留当前会话与输入输出，让陪伴本身比配置、诊断与管理更靠前。"
                    : "This page keeps only the active conversation and composer so companionship stays ahead of setup, diagnostics, and management."}
                </p>
              </div>

              <div className="chat-page-actions">
                <div className="chat-session-inline">
                  <span className="chat-session-inline-label">{locale === "zh" ? "当前会话" : "Active session"}</span>
                  <strong>{activeSession ? activeSession.title : copy.runtime.noLocalSession}</strong>
                  <span>{chatReady ? copy.runtime.runtimeReady : copy.runtime.setupRequired}</span>
                </div>
                <button className="button button-secondary" onClick={() => navigateTo("console")} type="button">
                  {locale === "zh" ? "打开控制台" : "Open console"}
                </button>
              </div>
            </div>

            <div className="panel chat-panel chat-panel-focused">
              <div className="panel-header">
                <span>{copy.runtime.canvas}</span>
                <span className="panel-tag">{chatReady ? copy.runtime.runtimeReady : copy.runtime.setupRequired}</span>
              </div>

              {chatRestoredAt ? (
                <div className="status-banner status-banner-info">
                  {copy.runtime.restored} {formatSessionTimestamp(chatRestoredAt, locale)}.
                </div>
              ) : null}

              <div className="chat-log">
                {chatMessages.length === 0 ? (
                  <div className="empty-chat-state">{copy.runtime.emptyChat}</div>
                ) : (
                  chatMessages.map((message) => (
                    <article
                      className={`chat-bubble ${message.role === "assistant" ? "chat-bubble-assistant" : "chat-bubble-user"}`}
                      key={message.id}
                    >
                      <span className="chat-role">{message.role === "assistant" ? copy.runtime.assistant : copy.runtime.you}</span>
                      <p>{message.content}</p>
                    </article>
                  ))
                )}
              </div>

              <div className="chat-composer">
                {pendingLocalAction && permissionProfile.localActions !== "allow" ? (
                  <div className="chat-local-action-card">
                    <div className="chat-local-action-copy">
                      <span className="chat-local-action-kicker">
                        {locale === "zh" ? "待确认动作" : "Pending action"}
                      </span>
                      <strong>{localizeLocalActionSummary(pendingLocalAction, locale)}</strong>
                      <p>
                        {permissionProfile.localActions === "deny"
                          ? locale === "zh"
                            ? "当前策略已拒绝本地动作。你可以先把旁边的本地动作权限切换为按需询问或允许。"
                            : "The current policy denies local actions. Change the local-action permission beside the composer first."
                          : permissionProfile.localActions === "ask"
                            ? locale === "zh"
                              ? "这次需要你点一次确认后才会执行。"
                              : "This one needs your explicit approval before it runs."
                            : locale === "zh"
                              ? "当前策略会自动执行本地动作。"
                              : "The current policy auto-runs local actions."}
                      </p>
                    </div>
                    <div className="chat-local-action-meta">
                      <span>{localizeLocalActionTargetLabel(pendingLocalAction, locale)}</span>
                      <div className="chat-local-action-buttons">
                        <button
                          className="button button-secondary"
                          onClick={() => void handleDismissPendingLocalAction()}
                          disabled={localActionResolveState === "loading"}
                          type="button"
                        >
                          {locale === "zh" ? "取消" : "Dismiss"}
                        </button>
                        <button
                          className="button button-primary"
                          onClick={() => void handleExecutePendingLocalAction()}
                          disabled={
                            localActionResolveState === "loading" ||
                            permissionProfile.localActions === "deny"
                          }
                          type="button"
                        >
                          {localActionResolveState === "loading"
                            ? copy.runtime.sending
                            : locale === "zh"
                              ? permissionProfile.localActions === "ask"
                                ? "允许一次并执行"
                                : "立即执行"
                              : permissionProfile.localActions === "ask"
                                ? "Allow once"
                                : "Run now"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder={copy.runtime.placeholder}
                  disabled={!chatReady || chatState === "loading"}
                />
                <div className="chat-composer-toolbar">
                  <div className="chat-composer-main-actions">
                    <button
                      className={`button button-secondary chat-live-button ${voiceConversationMode ? "chat-voice-button-active" : ""}`}
                      onClick={() => handleToggleSpeechInput()}
                      disabled={
                        !chatReady ||
                        chatState === "loading" ||
                        speechInputState === "processing" ||
                        speechInputState === "unsupported"
                      }
                      type="button"
                    >
                      {voiceConversationMode ? "End live chat" : "Start live chat"}
                    </button>
                    <button
                      className="button button-primary"
                      onClick={() => void handleSendMessage()}
                      disabled={!chatReady || !chatInput.trim() || chatState === "loading"}
                    >
                      {chatState === "loading" ? copy.runtime.sending : copy.runtime.send}
                    </button>
                  </div>

                  <div className="chat-composer-side-actions">
                    <div className="chat-permission-controls">
                      <button
                        className={`button button-secondary chat-permission-trigger ${chatPermissionTrayOpen ? "chat-permission-trigger-active" : ""}`}
                        onClick={() => setChatPermissionTrayOpen((current) => !current)}
                        type="button"
                      >
                        {`Permissions · ${
                              getPermissionPresetMode(permissionProfile) === "full"
                                ? "Full"
                                : getPermissionPresetMode(permissionProfile) === "elevated"
                                  ? "High"
                                  : "Limited"
                            }`}
                      </button>

                      <div className="chat-permission-mode-switch" role="group" aria-label={copy.runtime.permissions}>
                        <button
                          className={`chat-permission-mode-button ${getPermissionPresetMode(permissionProfile) === "limited" ? "chat-permission-mode-button-active" : ""}`}
                          onClick={() => handlePermissionPresetChange("limited")}
                          type="button"
                        >
                          Limited
                        </button>
                        <button
                          className={`chat-permission-mode-button ${getPermissionPresetMode(permissionProfile) === "elevated" ? "chat-permission-mode-button-active" : ""}`}
                          onClick={() => handlePermissionPresetChange("elevated")}
                          type="button"
                        >
                          High
                        </button>
                        <button
                          className={`chat-permission-mode-button ${getPermissionPresetMode(permissionProfile) === "full" ? "chat-permission-mode-button-active" : ""}`}
                          onClick={() => handlePermissionPresetChange("full")}
                          type="button"
                        >
                          Full
                        </button>
                      </div>

                      {chatPermissionTrayOpen ? (
                        <div className="chat-permission-popover">
                          <div className="chat-permission-popover-header">
                            <strong>{copy.runtime.permissions}</strong>
                            <span>{copy.runtime.permissionsHint}</span>
                          </div>

                          <div className="chat-permission-inline-grid">
                            {(
                              [
                                ["timeAwareness", copy.runtime.permissionTimeAwareness],
                                ["proactiveNotifications", copy.runtime.permissionProactiveNotifications],
                                ["desktopPresence", copy.runtime.permissionDesktopPresence],
                                ["localActions", copy.runtime.permissionLocalActions]
                              ] as const
                            ).map(([key, label]) => (
                              <div className="chat-permission-inline-card" key={key}>
                                <strong>{label}</strong>
                                <div className="permission-level-group chat-permission-level-group">
                                  {(
                                    [
                                      ["deny", copy.runtime.permissionDeny],
                                      ["ask", copy.runtime.permissionAsk],
                                      ["allow", copy.runtime.permissionAllow]
                                    ] as const
                                  ).map(([value, valueLabel]) => (
                                    <label className="permission-choice chat-permission-choice" key={value}>
                                      <input
                                        type="radio"
                                        name={`chat-permission-${key}`}
                                        value={value}
                                        checked={permissionProfile[key] === value}
                                        onChange={() => handlePermissionLevelChange(key, value)}
                                      />
                                      <span>{valueLabel}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {renderVoiceConfigControls("chat")}
                  </div>
                </div>
                <div className="chat-voice-status" aria-live="polite">
                  <span className={`chat-voice-status-badge chat-voice-status-${voicePlaybackState}`}>
                    {locale === "zh" ? "语音" : "Voice"}
                  </span>
                  <span>
                    {voiceStatusMessage ||
                      (locale === "zh"
                        ? "当前会根据回复情绪规划朗读语气。"
                        : "Reply playback will follow the current emotional tone.")}
                  </span>
                  <span className="chat-voice-meta">
                    {usesDedicatedVoiceProvider
                      ? locale === "zh"
                        ? `独立真人语音${voiceConfig?.provider ? ` · ${voiceConfig.provider}` : ""}${usesLocalVoiceProvider && voiceConfig?.engine ? ` · ${voiceConfig.engine}` : ""}`
                        : `Dedicated voice${voiceConfig?.provider ? ` · ${voiceConfig.provider}` : ""}${usesLocalVoiceProvider && voiceConfig?.engine ? ` · ${voiceConfig.engine}` : ""}`
                      : locale === "zh"
                        ? "跟随聊天模型"
                        : "Using chat provider"}
                  </span>
                  {selectedVoicePreset ? (
                    <span className="chat-voice-meta">
                      {selectedVoicePreset.label}
                      {voiceConfig?.voice ? ` · ${voiceConfig.voice}` : ""}
                    </span>
                  ) : null}
                </div>
                <div className="chat-voice-status chat-voice-status-secondary" aria-live="polite">
                  <span className={`chat-voice-status-badge chat-mic-status-${speechInputState}`}>
                    {locale === "zh" ? "麦克风" : "Mic"}
                  </span>
                  <span>
                    {speechInputStatusMessage ||
                      (speechInputState === "unsupported"
                        ? locale === "zh"
                          ? "当前浏览器暂不支持语音输入。"
                          : "Speech input is not supported in this browser."
                        : voiceConversationMode
                          ? locale === "zh"
                            ? "我会持续听你说、回答你、再继续听你。"
                            : "I will keep listening, answering, and listening again."
                          : locale === "zh"
                            ? "点开始实时对话后，我会把听到的内容直接送进对话。"
                            : "Start live chat and I will turn what I hear into the next turn.")}
                  </span>
                </div>
              </div>
            </div>

            <p className="chat-page-note">
              {locale === "zh"
                ? "切换会话、导入导出、持久化后端和运行诊断都留在控制台页面。"
                : "Session switching, import/export, persistence backends, and runtime diagnostics stay in the console page."}
            </p>
          </div>
        </section>
        ) : null}

        {currentPage === "roadmap" ? (
        <section className="section-grid section-block" id="roadmap">
          <div className="section-heading">
            <span className="section-caption">{copy.roadmap.caption}</span>
            <h2>{copy.roadmap.title}</h2>
            <p>
              {locale === "zh"
                ? "先把聊天、长期记忆、时间轴与关系成长做稳，再逐步推进语音、情绪和实时双工能力。"
                : "Stabilize chat, long-term memory, timeline, and relationship growth first, then expand into voice, emotion, and real-time duplex interaction."}
            </p>
          </div>
          <div className="roadmap-grid">
            {copy.roadmap.phases.map((phase) => (
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
        ) : null}
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
    const error = new Error(
      typeof payload.error === "string" ? payload.error : `Request failed with status ${response.status}.`
    ) as Error & { details?: string[] };

    if (Array.isArray(payload.details)) {
      error.details = payload.details.filter((detail): detail is string => typeof detail === "string");
    }

    throw error;
  }

  return payload as T;
}

function formatSessionTimestamp(updatedAt: string, locale: Locale = "en"): string {
  return new Date(updatedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
}

function formatPersistenceBackendLabel(backend: ChatPersistenceBackend | null, locale: Locale): string {
  const copy = getCopy(locale);

  if (backend === "sqlite") {
    return copy.formatting.backend.sqlite;
  }

  if (backend === "file") {
    return copy.formatting.backend.file;
  }

  return copy.formatting.backend.unknown;
}

function formatPersistenceSyncState(state: ChatPersistenceSyncState, locale: Locale): string {
  const copy = getCopy(locale);
  return copy.formatting.sync[state];
}

function formatModelOptionLabel(model: ModelDescriptor): string {
  const baseLabel = model.label ?? model.id;

  if (!model.contextWindow) {
    return baseLabel;
  }

  return `${baseLabel} (${formatContextWindow(model.contextWindow)})`;
}

function formatContextWindow(value: number): string {
  if (value >= 1000) {
    const shortened = value % 1000 === 0 ? value / 1000 : Number((value / 1000).toFixed(1));
    return `${shortened}k ctx`;
  }

  return `${value} ctx`;
}

function buildChatTurnTimeContext(
  permissionProfile: WavearyPermissionProfile
): ChatTurnTimeContext | undefined {
  if (permissionProfile.timeAwareness !== "allow") {
    return undefined;
  }

  const localTimeIso = new Date().toISOString();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale =
    typeof navigator !== "undefined" && typeof navigator.language === "string"
      ? navigator.language
      : undefined;

  return {
    localTimeIso,
    ...(timeZone ? { timeZone } : {}),
    ...(locale ? { locale } : {})
  };
}

function getCurrentDecisionDayPart(
  permissionProfile: WavearyPermissionProfile
): "late_night" | "morning" | "afternoon" | "evening" | undefined {
  return resolveNotificationDayPart(permissionProfile);
}

function formatMemoryType(type: string, locale: Locale): string {
  const copy = getCopy(locale);
  const table = copy.formatting.memoryType;

  if (type in table) {
    return table[type as keyof typeof table];
  }

  return type;
}

function patchOptionalTimeField<T extends { quietHoursStart?: string; quietHoursEnd?: string }>(
  current: T,
  field: "quietHoursStart" | "quietHoursEnd",
  value: string
): T {
  if (!value) {
    const next = { ...current };
    delete next[field];
    return next;
  }

  return {
    ...current,
    [field]: value
  };
}

function getBrowserNotificationPermission(): BrowserNotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return window.Notification.permission;
}

function createDefaultPermissionProfile(): WavearyPermissionProfile {
  return createLimitedPermissionProfile();
}

function createLimitedPermissionProfile(): WavearyPermissionProfile {
  return {
    browserNotifications: "allow",
    proactiveNotifications: "allow",
    timeAwareness: "allow",
    desktopPresence: "ask",
    localActions: "ask"
  };
}

function createElevatedPermissionProfile(): WavearyPermissionProfile {
  return {
    browserNotifications: "allow",
    proactiveNotifications: "allow",
    timeAwareness: "allow",
    desktopPresence: "allow",
    localActions: "ask"
  };
}

function createFullAccessPermissionProfile(): WavearyPermissionProfile {
  return {
    browserNotifications: "allow",
    proactiveNotifications: "allow",
    timeAwareness: "allow",
    desktopPresence: "allow",
    localActions: "allow"
  };
}

function loadPermissionProfile(): WavearyPermissionProfile {
  if (typeof window === "undefined") {
    return createDefaultPermissionProfile();
  }

  try {
    const raw = window.localStorage.getItem("waveary-permission-profile");

    if (!raw) {
      return createDefaultPermissionProfile();
    }

    const parsed = JSON.parse(raw) as Partial<WavearyPermissionProfile>;
    const defaults = createDefaultPermissionProfile();

    return {
      browserNotifications: normalizePermissionLevel(parsed.browserNotifications, defaults.browserNotifications),
      proactiveNotifications: normalizePermissionLevel(parsed.proactiveNotifications, defaults.proactiveNotifications),
      timeAwareness: normalizePermissionLevel(parsed.timeAwareness, defaults.timeAwareness),
      desktopPresence: normalizePermissionLevel(parsed.desktopPresence, defaults.desktopPresence),
      localActions: normalizePermissionLevel(parsed.localActions, defaults.localActions)
    };
  } catch {
    return createDefaultPermissionProfile();
  }
}

function normalizePermissionLevel(
  value: PermissionLevel | undefined,
  fallback: PermissionLevel
): PermissionLevel {
  return value === "allow" || value === "ask" || value === "deny" ? value : fallback;
}

function getPermissionPresetMode(
  permissionProfile: WavearyPermissionProfile
): PermissionPresetMode {
  if (
    permissionProfile.browserNotifications === "allow" &&
    permissionProfile.proactiveNotifications === "allow" &&
    permissionProfile.timeAwareness === "allow" &&
    permissionProfile.desktopPresence === "allow" &&
    permissionProfile.localActions === "allow"
  ) {
    return "full";
  }

  if (
    permissionProfile.browserNotifications === "allow" &&
    permissionProfile.proactiveNotifications === "allow" &&
    permissionProfile.timeAwareness === "allow" &&
    permissionProfile.desktopPresence === "allow" &&
    permissionProfile.localActions === "ask"
  ) {
    return "elevated";
  }

  return "limited";
}

function formatBrowserNotificationPermission(
  permission: BrowserNotificationPermissionState,
  locale: Locale
): string {
  if (permission === "unsupported") {
    return locale === "zh" ? "当前浏览器不支持" : "unsupported";
  }

  if (permission === "granted") {
    return locale === "zh" ? "已授权" : "granted";
  }

  if (permission === "denied") {
    return locale === "zh" ? "已拒绝" : "denied";
  }

  return locale === "zh" ? "未决定" : "default";
}

function formatProactiveAutoCheckOutcome(
  outcome: ProactiveAutoCheckOutcome | null,
  locale: Locale
): string {
  if (!outcome) {
    return locale === "zh" ? "尚未执行" : "Not run yet";
  }

  const copy = getCopy(locale);

  if (outcome === "notified") {
    return copy.runtime.proactiveAutoOutcomeNotified;
  }

  if (outcome === "recommended") {
    return copy.runtime.proactiveAutoOutcomeRecommended;
  }

  return copy.runtime.proactiveAutoOutcomeWait;
}

function formatVoiceFallbackReason(
  fallbackReason: string | undefined,
  providerType: VoiceRoutingStatus["providerType"] | undefined,
  presetId: string | null,
  locale: Locale
): string | null {
  const raw = fallbackReason?.trim();

  if (!raw) {
    return null;
  }

  if (providerType === "gemini" && raw.includes("model_not_found")) {
    if (presetId === "gemini-micu") {
      return locale === "zh"
        ? "Micu Relay \u5f53\u524d\u4e0d\u8ba4\u8fd9\u4e2a Gemini TTS \u6a21\u578b\u540d\u3002\u8bf7\u4f18\u5148\u6539\u7528 Micu \u5df2\u8bc6\u522b\u7684 `gemini-2.5-flash-tts-preview` \u6216 `gemini-2.5-pro-tts-preview`\u3002"
        : "Micu relay does not currently recognize this Gemini TTS model name. Prefer the Micu-recognized `gemini-2.5-flash-tts-preview` or `gemini-2.5-pro-tts-preview` names instead.";
    }

    return locale === "zh"
      ? "\u5f53\u524d Gemini \u8def\u7531\u6ca1\u6709\u627e\u5230\u8fd9\u4e2a TTS \u6a21\u578b\u3002\u8bf7\u786e\u8ba4\u6a21\u578b\u540d\u662f\u5426\u5c5e\u4e8e\u5f53\u524d\u4f9b\u5e94\u5546\u5b9e\u9645\u652f\u6301\u7684 Gemini TTS \u5bb6\u65cf\u3002"
      : "The current Gemini route could not find this TTS model. Check whether the model name actually belongs to the Gemini TTS family supported by this provider.";
  }

  if (providerType === "gemini" && raw.includes("This token has no access to model")) {
    return locale === "zh"
      ? "\u5f53\u524d API Key \u5df2\u7ecf\u6253\u5230\u6b63\u786e\u6a21\u578b\u4e86\uff0c\u4f46\u8fd9\u4e2a Key \u8fd8\u6ca1\u6709\u8be5\u6a21\u578b\u7684\u8bbf\u95ee\u6743\u9650\u3002\u6362\u4e00\u4e2a\u5df2\u5f00\u901a\u6b64\u6a21\u578b\u6743\u9650\u7684 Key \u624d\u80fd\u771f\u6b63\u51fa\u58f0\u3002"
      : "The request already reached the correct model, but this API key does not currently have access to it. Use a key with that model enabled to get real provider audio.";
  }

  return raw;
}

function pickSpeechVoice(
  voices: SpeechSynthesisVoice[],
  plan: NonNullable<VoiceSpeakPlanResponse["plan"]>
): SpeechSynthesisVoice | null {
  if (voices.length === 0) {
    return null;
  }

  const normalizedKeywords = plan.preferredVoiceKeywords.map((keyword) => keyword.toLowerCase());
  const normalizedLang = plan.lang.toLowerCase();

  const exactLanguageMatch = voices.find((voice) => voice.lang.toLowerCase() === normalizedLang);
  const keywordMatch = voices.find((voice) => {
    const label = `${voice.name} ${voice.lang}`.toLowerCase();
    return normalizedKeywords.some((keyword) => label.includes(keyword));
  });
  const partialLanguageMatch = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(normalizedLang.split("-")[0] ?? normalizedLang)
  );

  return keywordMatch ?? exactLanguageMatch ?? partialLanguageMatch ?? voices[0] ?? null;
}

function getSpeechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function getMediaRecorderConstructor(): BrowserMediaRecorderConstructor {
  if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
    throw new Error("MediaRecorder is not available in this browser.");
  }

  return window.MediaRecorder as unknown as BrowserMediaRecorderConstructor;
}

function pickSupportedRecorderMimeType(
  MediaRecorderCtor: BrowserMediaRecorderConstructor
): string | undefined {
  const mediaRecorderWithSupport = MediaRecorderCtor as BrowserMediaRecorderConstructor & {
    isTypeSupported?: (mimeType: string) => boolean;
  };
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

  if (typeof mediaRecorderWithSupport.isTypeSupported !== "function") {
    return candidates[0];
  }

  return candidates.find((candidate) => mediaRecorderWithSupport.isTypeSupported?.(candidate));
}

function canUseProviderSpeechToText(
  voiceConfig: SavedVoiceConfig | null,
  voiceRoutingStatus: VoiceRoutingStatus | null
): boolean {
  if (!voiceConfig || !voiceRoutingStatus) {
    return false;
  }

  if (!voiceRoutingStatus.ready) {
    return false;
  }

  if (voiceRoutingStatus.providerType === "shared-chat-provider") {
    return true;
  }

  return (
    voiceRoutingStatus.providerType === "openai-compatible" ||
    voiceRoutingStatus.providerType === "fish-audio"
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return window.btoa(binary);
}

function buildSpeechAudioFileName(mimeType: string): string {
  if (mimeType.includes("mp4")) {
    return "waveary-input.mp4";
  }

  if (mimeType.includes("wav")) {
    return "waveary-input.wav";
  }

  return "waveary-input.webm";
}

function measureSpeechActivity(sampleBuffer: Uint8Array): number {
  if (sampleBuffer.length === 0) {
    return 0;
  }

  let squaredSum = 0;

  for (const sample of sampleBuffer) {
    const normalized = (sample - 128) / 128;
    squaredSum += normalized * normalized;
  }

  return Math.sqrt(squaredSum / sampleBuffer.length);
}

function composeSpeechDraft(base: string, finalTranscript: string, interimTranscript = ""): string {
  return [base.trim(), finalTranscript.trim(), interimTranscript.trim()]
    .filter(Boolean)
    .join(" ");
}

function localizeSpeechInputError(error: string, locale: Locale): string {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return locale === "zh"
      ? "麦克风权限被拒绝了，请先允许浏览器使用麦克风。"
      : "Microphone access was denied. Allow the browser to use your microphone first.";
  }

  if (error === "no-speech") {
    return locale === "zh" ? "没有听到声音，我们再试一次。" : "I did not hear anything. Try again.";
  }

  if (error === "audio-capture") {
    return locale === "zh"
      ? "没有找到可用的麦克风。"
      : "No working microphone was detected.";
  }

  if (error === "network") {
    return locale === "zh"
      ? "语音识别网络出了点问题。"
      : "Speech recognition hit a network problem.";
  }

  return locale === "zh" ? "语音输入失败了。" : "Speech input failed.";
}

function localizeVoiceStyle(style: string, locale: Locale): string {
  if (locale !== "zh") {
    return style;
  }

  if (style === "concerned") {
    return "担心";
  }

  if (style === "bright") {
    return "轻快";
  }

  if (style === "warm") {
    return "温柔";
  }

  if (style === "quiet") {
    return "轻声";
  }

  return "柔和";
}

function deliverProactiveBrowserNotification(
  decision: ProactiveCareDecision,
  locale: Locale,
  permissionProfile: WavearyPermissionProfile,
  providedDraft?: ProactiveMessageDraft
): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  const draft =
    providedDraft ??
    buildProactiveMessageDraft(decision, locale, resolveNotificationDayPart(permissionProfile));
  const title =
    locale === "zh" ? "Waveary 主动关怀提醒" : "Waveary Proactive Care";
  const bodyParts = [
    draft.lead,
    decision.intent
      ? locale === "zh"
        ? `意图：${formatProactiveIntent(decision.intent, locale)}`
        : `Intent: ${formatProactiveIntent(decision.intent, locale)}`
      : null,
    decision.urgency
      ? locale === "zh"
        ? `级别：${formatProactiveUrgency(decision.urgency, locale)}`
        : `Urgency: ${formatProactiveUrgency(decision.urgency, locale)}`
      : null,
    decision.reasons[0] ? formatProactiveReason(decision.reasons[0], locale) : null
  ].filter((part): part is string => Boolean(part));

  new window.Notification(title, {
    body:
      bodyParts.length > 0
        ? bodyParts.join(" · ")
        : locale === "zh"
          ? "当前会话被评估为适合主动关怀。"
          : "The active session was evaluated as ready for proactive care."
  });
}

function localizeLocalActionSummary(
  action: PendingLocalAction,
  locale: Locale
): string {
  if (locale === "zh") {
    if (action.kind === "open_url") {
      return `打开 ${action.targetLabel}`;
    }

    if (action.kind === "open_folder") {
      return `打开 ${action.targetLabel} 文件夹`;
    }

    if (action.kind === "launch_app") {
      return `启动 ${action.targetLabel}`;
    }

    if (action.kind === "browser_extract_text") {
      return "读取当前页面";
    }

    if (action.kind === "browser_search_text") {
      return `在当前页面搜索 ${action.targetLabel}`;
    }

    if (action.kind === "browser_list_clickable") {
      return "查看当前页面可点击项";
    }

    return `点击 ${action.targetLabel}`;
  }

  return action.summary;
}

function localizeLocalActionTargetLabel(
  action: PendingLocalAction,
  locale: Locale
): string {
  if (
    action.kind === "browser_extract_text" ||
    action.kind === "browser_list_clickable"
  ) {
    return locale === "zh" ? "当前页面" : "Current page";
  }

  return action.targetLabel;
}

function localizeLocalActionMessage(message: string, locale: Locale): string {
  if (locale !== "zh") {
    return message;
  }

  return message
    .replace(/^Opened /, "已打开 ")
    .replace(/^Launched /, "已启动 ")
    .replace(/^Read the current page\.$/, "已读取当前页面。")
    .replace(/^Checked clickable items on the current page\.$/, "已查看当前页面可点击项。")
    .replace(/^Clicked "(.+?)"\.$/, "已点击“$1”。")
    .replace(/^Searched the current page for "(.+?)"\.$/, "已在当前页面搜索“$1”。")
    .replace(/\.$/, "。");
}

function downloadSessionExport(exported: ExportedChatSession): void {
  const blob = new Blob([JSON.stringify(exported, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeTitle =
    exported.title
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

function getErrorDetails(error: unknown): string[] {
  if (
    error instanceof Error &&
    "details" in error &&
    Array.isArray((error as Error & { details?: string[] }).details)
  ) {
    return (error as Error & { details?: string[] }).details ?? [];
  }

  return [];
}
