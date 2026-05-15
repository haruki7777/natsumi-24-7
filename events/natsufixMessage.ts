import { Events } from "discord.js";
import { analyzeWithGemini, createCodexHandoffPrompt, readRecentErrorLog } from "../utils/natsuFix.js";

const PREFIX = process.env.NATSUFIX_PREFIX || "나츠미수리";

const ownerIds = () =>
  new Set(
    (process.env.NATSUFIX_OWNER_IDS || process.env.NATSUMI_OWNER_ID || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );

const isAllowed = (userId: string) => {
  const owners = ownerIds();
  return owners.size > 0 && owners.has(userId);
};

const replyLong = async (message: any, content: string) => {
  const safe = content.slice(0, 1900);
  await message.reply(safe.length < content.length ? `${safe}\n\n…내용이 길어서 일부만 표시했어.` : safe);
};

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message: any) {
    if (message.author?.bot) return;
    if (!message.content?.startsWith(PREFIX)) return;
    if (!isAllowed(message.author.id)) return;

    const args = message.content.slice(PREFIX.length).trim();
    const [command, ...rest] = args.split(/\s+/);
    const question = rest.join(" ").trim();

    if (!command || command === "도움말") {
      return replyLong(
        message,
        [
          "🛠️ NatsuFix 개발자 전용 숨김 명령어",
          `\`${PREFIX} 분석 [질문]\` - 최근 오류 로그를 Gemini로 분석`,
          `\`${PREFIX} 로그\` - 최근 오류 로그 확인`,
          `\`${PREFIX} 코덱스\` - Codex에 넘길 작업지시서 생성`,
        ].join("\n")
      );
    }

    if (command === "로그") {
      const log = readRecentErrorLog(1800) || "최근 오류 로그가 없어.";
      return replyLong(message, `🧾 최근 오류 로그\n\n\`\`\`text\n${log}\n\`\`\``);
    }

    if (command === "코덱스") {
      const prompt = createCodexHandoffPrompt().slice(0, 1800);
      return replyLong(message, `🧠 Codex 넘기기 프롬프트\n\n\`\`\`text\n${prompt}\n\`\`\``);
    }

    if (command === "분석") {
      const result = await analyzeWithGemini(question || undefined);
      return replyLong(message, `🛠️ NatsuFix 분석 결과 (${result.mode})\n\n${result.text}`);
    }
  },
};
