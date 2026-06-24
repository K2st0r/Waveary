import type { LocalTimeContext } from "../providers/interfaces.js";

const EN_TIME_PATTERNS = [
  /\bwhat\s+time\b/i,
  /\bcurrent\s+time\b/i,
  /\btime\s+is\s+it\b/i,
  /\bwhat\s+day\b/i,
  /\bwhat'?s\s+the\s+date\b/i,
  /\bwhat\s+date\b/i,
  /\bwhat\s+day\s+is\s+it\b/i,
  /\bwhat\s+weekday\b/i,
  /\bwhat\s+day\s+is\s+it\s+today\b/i,
  /\bwhat'?s\s+today'?s\s+date\b/i,
  /\bwhat\s+time\s+is\s+it\s+(right\s+)?now\b/i,
  /\bdo\s+you\s+know\s+what\s+time\s+it\s+is\b/i,
  /\bare\s+you\s+still\s+unable\s+to\s+tell\s+the\s+time\b/i,
  /\bcan'?t\s+you\s+tell\s+me\s+the\s+time\b/i
];

const ZH_TIME_PATTERNS = [
  /\u51e0\u70b9/,
  /\u51e0\u70b9\u4e86/,
  /\u73b0\u5728\u51e0\u70b9/,
  /\u5177\u4f53\u51e0\u70b9/,
  /\u73b0\u5728\u662f\u51e0\u70b9/,
  /\u73b0\u5728\u662f\u4ec0\u4e48\u65f6\u95f4/,
  /\u73b0\u5728\u51e0\u5206/,
  /\u51e0\u70b9\u51e0\u5206/,
  /\u73b0\u5728\u51e0\u70b9\u51e0\u5206/,
  /\u544a\u8bc9\u6211\u51e0\u70b9/,
  /\u544a\u8bc9\u6211\u73b0\u5728\u51e0\u70b9/,
  /\u73b0\u5728\u51e0\u53f7/,
  /\u4eca\u5929\u51e0\u53f7/,
  /\u4eca\u5929\u51e0\u6708\u51e0\u53f7/,
  /\u73b0\u5728\u51e0\u6708\u51e0\u53f7/,
  /\u4eca\u5929\u661f\u671f\u51e0/,
  /\u73b0\u5728\u661f\u671f\u51e0/,
  /\u4eca\u5929\u5468\u51e0/,
  /\u73b0\u5728\u5468\u51e0/,
  /\u4eca\u5929\u793c\u62dc\u51e0/,
  /\u73b0\u5728\u793c\u62dc\u51e0/,
  /\u4f60\u8fd8\u662f\u6ca1\u529e\u6cd5\u544a\u8bc9\u6211\u5177\u4f53\u51e0\u70b9/,
  /\u4f60\u8fd8\u662f\u4e0d\u77e5\u9053\u73b0\u5728\u51e0\u70b9/,
  /\u4f60\u8fd8\u662f\u4e0d\u80fd\u544a\u8bc9\u6211\u73b0\u5728\u51e0\u70b9/,
  /\u4f60\u8fd8\u662f\u65e0\u6cd5\u544a\u8bc9\u6211\u73b0\u5728\u51e0\u70b9/
];

export function isDirectLocalTimeQuestion(content: string): boolean {
  return (
    ZH_TIME_PATTERNS.some((pattern) => pattern.test(content)) ||
    EN_TIME_PATTERNS.some((pattern) => pattern.test(content))
  );
}

export function buildDeterministicLocalTimeReply(
  content: string,
  localTime?: LocalTimeContext
): string | undefined {
  if (!localTime || !isDirectLocalTimeQuestion(content)) {
    return undefined;
  }

  const localDate = new Date(localTime.iso);
  const locale = localTime.locale ?? "en-US";
  const formatted = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "short",
    ...(localTime.timeZone ? { timeZone: localTime.timeZone } : {})
  }).format(localDate);

  if (locale.toLowerCase().startsWith("zh")) {
    return `\u6211\u8fd9\u8fb9\u770b\u5230\u4f60\u73b0\u5728\u7684\u672c\u5730\u65f6\u95f4\u662f ${formatted}\u3002\u5982\u679c\u4f60\u613f\u610f\uff0c\u6211\u53ef\u4ee5\u987a\u7740\u8fd9\u4e2a\u65f6\u95f4\u70b9\u7ee7\u7eed\u966a\u4f60\u804a\u4e0b\u53bb\u3002`;
  }

  return `I can see your local time as ${formatted}. If you want, I can stay with this moment and keep going with you from here.`;
}
