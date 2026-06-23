import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const suspiciousPattern =
  /(锛|銆|鈥|鈥�|鍥|鍙|璇|璁|鎺|閿|妯|鐪|绗|鍐|鍏|闂|鎯|浜|闀|杩|浼|鍚|璁剧疆|鏃堕棿|璇煶|鎺у埗鍙)/;

function getDiffText() {
  try {
    return execFileSync("git", ["diff", "--no-color", "--unified=0", "HEAD", "--"], {
      cwd: repoRoot,
      encoding: "utf8"
    });
  } catch (error) {
    const message =
      error instanceof Error && "message" in error ? String(error.message) : "unknown git diff failure";
    console.error(`Failed to inspect git diff: ${message}`);
    process.exit(1);
  }
}

function isTextPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".md",
    ".css",
    ".scss",
    ".html",
    ".yml",
    ".yaml",
    ".txt"
  ]).has(ext);
}

function collectSuspiciousAdditions(diffText) {
  const lines = diffText.split(/\r?\n/);
  const findings = [];
  let currentFile = "";

  for (const line of lines) {
    if (line.startsWith("+++ b/")) {
      currentFile = line.slice("+++ b/".length);
      continue;
    }

    if (!currentFile || !isTextPath(currentFile)) {
      continue;
    }

    if (!line.startsWith("+") || line.startsWith("+++")) {
      continue;
    }

    const addedText = line.slice(1);
    if (!suspiciousPattern.test(addedText)) {
      continue;
    }

    findings.push({
      file: currentFile,
      line: addedText
    });
  }

  return findings;
}

function collectUnreadableFiles(diffText) {
  const files = new Set();

  for (const line of diffText.split(/\r?\n/)) {
    if (line.startsWith("+++ b/")) {
      const filePath = line.slice("+++ b/".length);
      if (filePath !== "/dev/null" && isTextPath(filePath)) {
        files.add(filePath);
      }
    }
  }

  const unreadable = [];
  for (const filePath of files) {
    const absolutePath = path.join(repoRoot, filePath);
    if (!existsSync(absolutePath)) {
      continue;
    }

    try {
      readFileSync(absolutePath, "utf8");
    } catch (error) {
      const message =
        error instanceof Error && "message" in error ? String(error.message) : "unknown read failure";
      unreadable.push({ file: filePath, message });
    }
  }

  return unreadable;
}

const diffText = getDiffText();

if (!diffText.trim()) {
  console.log("No working-tree changes detected. Mojibake check skipped.");
  process.exit(0);
}

const unreadableFiles = collectUnreadableFiles(diffText);
if (unreadableFiles.length > 0) {
  console.error("Mojibake guard could not read one or more changed files as UTF-8:");
  for (const finding of unreadableFiles) {
    console.error(`- ${finding.file}: ${finding.message}`);
  }
  process.exit(1);
}

const suspiciousAdditions = collectSuspiciousAdditions(diffText);

if (suspiciousAdditions.length > 0) {
  console.error("Possible mojibake detected in newly added lines:");
  for (const finding of suspiciousAdditions) {
    console.error(`- ${finding.file}: ${finding.line}`);
  }
  console.error("Verify with git diff and replace the affected copy using an encoding-safe edit path.");
  process.exit(1);
}

console.log("No suspicious mojibake patterns found in added lines.");
