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
  /\btoday\b/i,
  /\btonight\b/i,
  /\btomorrow\b/i
];

const ZH_TIME_PATTERNS = [
  "几点",
  "几点了",
  "现在几点",
  "具体几点",
  "现在是几点",
  "现在是什么时间",
  "现在几分",
  "几点几分",
  "现在几点几分",
  "告诉我几点",
  "告诉你现在几点",
  "不知道几点",
  "没法告诉你",
  "无法告诉你",
  "不能告诉你",
  "时间",
  "日期",
  "几号",
  "几月几号",
  "星期几",
  "周几",
  "礼拜几",
  "今天",
  "今晚",
  "明天"
];

export function isDirectLocalTimeQuestion(content: string): boolean {
  const normalized = content.toLowerCase().replace(/\s+/g, "");

  if (ZH_TIME_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return true;
  }

  return EN_TIME_PATTERNS.some((pattern) => pattern.test(content));
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
    return `我这边看到你现在的本地时间是 ${formatted}。如果你愿意，我可以顺着这个时间点继续陪你聊下去。`;
  }

  return `I can see your local time as ${formatted}. If you want, I can stay with this moment and keep going with you from here.`;
}
