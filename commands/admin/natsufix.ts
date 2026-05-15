import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { analyzeWithGemini, createCodexHandoffPrompt, readRecentErrorLog } from "../../utils/natsuFix.js";

const ownerIds = () =>
  new Set(
    (process.env.NATSUFIX_OWNER_IDS || process.env.NATSUMI_OWNER_ID || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );

const isAllowed = (interaction: any) => {
  const owners = ownerIds();
  return owners.size > 0 && owners.has(interaction.user.id);
};

const sendLong = async (interaction: any, content: string) => {
  const safe = content.slice(0, 1900);
  await interaction.editReply(safe.length < content.length ? `${safe}\n\n…내용이 길어서 일부만 표시했어.` : safe);
};

export default {
  data: new SlashCommandBuilder()
    .setName("natsufix")
    .setDescription("나츠미 개발자 전용 자동수리 분석 도구")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("분석")
        .setDescription("최근 오류 로그를 Gemini로 분석합니다.")
        .addStringOption((option) =>
          option.setName("질문").setDescription("예: nsfw2 셀렉트메뉴가 왜 안 떠?").setRequired(false)
        )
    )
    .addSubcommand((sub) => sub.setName("로그").setDescription("최근 자동수리 오류 로그를 확인합니다."))
    .addSubcommand((sub) => sub.setName("코덱스").setDescription("Codex에 넘길 안전 프롬프트를 생성합니다.")),

  async execute(interaction: any) {
    if (!isAllowed(interaction)) {
      return interaction.reply({
        content: "개발자 전용 명령어야. NATSUFIX_OWNER_IDS에 등록된 계정만 쓸 수 있어. 흥 😤",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "로그") {
      const log = readRecentErrorLog(1800) || "최근 오류 로그가 없어.";
      return sendLong(interaction, `🧾 최근 오류 로그\n\n\`\`\`text\n${log}\n\`\`\``);
    }

    if (subcommand === "코덱스") {
      const prompt = createCodexHandoffPrompt().slice(0, 1800);
      return sendLong(interaction, `🧠 Codex 넘기기 프롬프트\n\n\`\`\`text\n${prompt}\n\`\`\``);
    }

    const question = interaction.options.getString("질문") || undefined;
    const result = await analyzeWithGemini(question);
    return sendLong(interaction, `🛠️ NatsuFix 분석 결과 (${result.mode})\n\n${result.text}`);
  },
};
