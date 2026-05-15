import fs from "fs";
import path from "path";

export type NatsuFixMode = "gemini" | "codex";

const DEFAULT_DENY = [
  ".env",
  ".env.local",
  ".env.production",
  "config.json",
  "secrets.json",
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
];

const LOG_DIR = path.join(process.cwd(), "logs");
const ERROR_LOG_PATH = path.join(LOG_DIR, "error.log");

const maskSecret = (value: string) =>
  value
    .replace(/(TOKEN|API_KEY|KEY|SECRET|PASSWORD|MONGOOSE|MONGODB_URI)\s*=\s*[^\s]+/gi, "$1=[MASKED]")
    .replace(/Bot\s+[A-Za-z0-9._-]+/g, "Bot [MASKED]")
    .replace(/[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}/g, "[MASKED_DISCORD_TOKEN]");

export const appendNatsuFixLog = (message: string) => {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(ERROR_LOG_PATH, `${new Date().toISOString()} ${maskSecret(message)}\n`, "utf-8");
  } catch {
    // logging must never crash the bot
  }
};

export const readRecentErrorLog = (maxChars = 12000) => {
  if (!fs.existsSync(ERROR_LOG_PATH)) return "";
  const raw = fs.readFileSync(ERROR_LOG_PATH, "utf-8");
  return maskSecret(raw.slice(-maxChars));
};

const isDenied = (filePath: string) => {
  const normalized = filePath.replace(/\\/g, "/");
  return DEFAULT_DENY.some((blocked) => normalized.includes(blocked));
};

const extractFileHints = (errorLog: string) => {
  const matches = [...errorLog.matchAll(/(?:file:\/\/)?([^\s()]+\.(?:js|ts|mjs|cjs))/gi)]
    .map((match) => match[1].replace(process.cwd(), "").replace(/^[/\\]/, ""))
    .filter((filePath) => !isDenied(filePath));
  return [...new Set(matches)].slice(0, 8);
};

const readSafeFiles = (files: string[]) => {
  return files
    .map((filePath) => {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fullPath.startsWith(process.cwd()) || isDenied(filePath) || !fs.existsSync(fullPath)) return null;
      const stat = fs.statSync(fullPath);
      if (!stat.isFile() || stat.size > 80_000) return null;
      return `\n--- FILE: ${filePath} ---\n${fs.readFileSync(fullPath, "utf-8").slice(0, 50_000)}`;
    })
    .filter(Boolean)
    .join("\n");
};

export const chooseNatsuFixMode = (errorLog: string): NatsuFixMode => {
  const lower = errorLog.toLowerCase();
  const riskyKeywords = [
    "schema",
    "migration",
    "permission",
    "role",
    "admin",
    "mongodb",
    "mongoose",
    "token",
    "security",
    "refactor",
  ];
  const manyFiles = extractFileHints(errorLog).length >= 4;
  return manyFiles || riskyKeywords.some((keyword) => lower.includes(keyword)) ? "codex" : "gemini";
};

const callGemini = async (prompt: string) => {
  const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY 또는 MY_GEMINI_API_KEY가 필요합니다.");

  const model = process.env.NATSUFIX_GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: Number(process.env.NATSUFIX_MAX_OUTPUT_TOKENS || 1800),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API 실패: ${response.status} ${await response.text()}`.slice(0, 500));
  }

  const data: any = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text).join("\n")?.trim() || "수정안을 생성하지 못했습니다.";
};

export const createCodexHandoffPrompt = (errorLog = readRecentErrorLog()) => {
  const safeLog = maskSecret(errorLog || "최근 오류 로그가 없습니다.");
  const fileHints = extractFileHints(safeLog);
  const fileContext = readSafeFiles(fileHints);

  return [
    "아래 나츠미 Discord 봇 오류를 분석하고, 안전한 리팩터링 PR을 만들어줘.",
    "조건:",
    "- .env, 토큰, API Key, Mongo URI는 절대 읽거나 출력하지 말 것",
    "- 변경 전후 요약과 위험도를 적을 것",
    "- DB/권한/NSFW/관리자 기능은 보수적으로 수정할 것",
    "- 테스트 또는 최소한 npm run check 결과를 확인할 것",
    "",
    "[오류 로그]",
    safeLog,
    "",
    "[관련 파일 컨텍스트]",
    fileContext || "파일 힌트를 찾지 못했습니다. 저장소 전체를 안전하게 탐색해 주세요.",
  ].join("\n").slice(0, 30000);
};

export const analyzeWithGemini = async (question?: string) => {
  const errorLog = readRecentErrorLog();
  const mode = chooseNatsuFixMode(`${question || ""}\n${errorLog}`);
  const fileHints = extractFileHints(errorLog);
  const fileContext = readSafeFiles(fileHints);

  if (mode === "codex") {
    return {
      mode,
      text: [
        "위험하거나 큰 수정으로 보여서 Gemini 자동수정보다는 Codex에 넘기는 게 안전합니다.",
        "아래 프롬프트를 Codex에 붙여넣어 PR 작업으로 맡기세요.",
        "```text",
        createCodexHandoffPrompt(errorLog).slice(0, 3500),
        "```",
      ].join("\n"),
    };
  }

  const prompt = [
    "너는 나츠미 Discord 봇의 안전한 코드 수리 도우미야.",
    "바로 코드를 덮어쓰지 말고 원인, 수정 방향, 확인 명령만 제안해.",
    "비밀값(.env, 토큰, API Key, Mongo URI)은 출력하지 마.",
    "답변은 한국어로 간결하지만 정확하게 작성해.",
    question ? `\n[사용자 질문]\n${question}` : "",
    "\n[최근 오류 로그]",
    errorLog || "최근 오류 로그가 없습니다.",
    "\n[관련 파일]",
    fileContext || "관련 파일을 자동으로 찾지 못했습니다.",
  ].join("\n");

  return { mode, text: await callGemini(prompt) };
};
