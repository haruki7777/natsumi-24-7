import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { REST, Routes } from "discord.js";
import { reloadBotResources } from "../../utils/reloadBotResources.js";

const ownerIds = () =>
  new Set(
    (process.env.NATSUFIX_OWNER_IDS || process.env.NATSUMI_OWNER_ID || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );

const canUse = (interaction) => {
  const owners = ownerIds();
  return owners.size > 0 && owners.has(interaction.user.id);
};

const syncSlashCommands = async (commandsJson) => {
  const token = process.env.TOKEN?.replace(/[\"']/g, "").trim();
  const clientId = process.env.ID?.replace(/[\"']/g, "").trim();
  if (!token || !clientId || commandsJson.length === 0) return false;

  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationCommands(clientId), { body: commandsJson });
  return true;
};

export default {
  data: new SlashCommandBuilder()
    .setName("명령어리로드")
    .setDescription("개발자 전용: 최신 명령어를 다시 불러오고 캐시를 정리합니다.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option
        .setName("동기화")
        .setDescription("Discord slash command 목록까지 다시 동기화합니다.")
        .setRequired(false)
    ),

  async execute(interaction, client) {
    if (!canUse(interaction)) {
      return interaction.reply({ content: "개발자 전용 명령어야. 흥 😤", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const shouldSync = interaction.options.getBoolean("동기화") ?? true;
    const result = await reloadBotResources(client);
    let synced = false;

    if (shouldSync) {
      synced = await syncSlashCommands(result.commandsJson);
    }

    const errorText = result.errors.length
      ? `\n\n⚠️ 로딩 오류 ${result.errors.length}개\n\`\`\`text\n${result.errors.slice(0, 8).join("\n").slice(0, 1000)}\n\`\`\``
      : "";

    return interaction.editReply([
      "✅ 명령어 캐시 리로드 완료",
      `명령어: ${result.previousCommandCount}개 → ${result.commandCount}개`,
      `버튼: ${result.previousButtonCount}개 → ${result.buttonCount}개`,
      `Discord 명령어 동기화: ${synced ? "완료" : "건너뜀"}`,
      errorText,
    ].join("\n"));
  },
};
