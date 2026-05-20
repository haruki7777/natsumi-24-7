import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";

const DASHBOARD_URL = process.env.NATSUMI_DASHBOARD_URL || process.env.DASHBOARD_URL || "http://natsumidashboard.kro.kr/";
const OWNER_IDS = new Set(
  [
    process.env.NATSUMI_OWNER_ID,
    process.env.OWNER_USER_ID,
    ...(process.env.NATSUFIX_OWNER_IDS || "").split(","),
    "1293232804745838733",
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean),
);

export default {
  data: new SlashCommandBuilder()
    .setName("개발자공지")
    .setDescription("나츠미 지원서버 공지를 대시보드에서 작성해요."),

  async execute(interaction) {
    if (!OWNER_IDS.has(interaction.user.id)) {
      return interaction.reply({ content: "이 공지는 나츠미 개발자만 열 수 있어요.", ephemeral: true });
    }

    const noticeUrl = new URL(DASHBOARD_URL);
    noticeUrl.searchParams.set("panel", "developer-notice");

    const embed = new EmbedBuilder()
      .setColor("#ff7aa8")
      .setTitle("나츠미 개발자 공지")
      .setDescription("대시보드에서 공지를 작성하면 나츠미 지원서버 공지 채널로 웹훅 전송돼요.")
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("공지 작성하러 가기")
        .setStyle(ButtonStyle.Link)
        .setURL(noticeUrl.toString()),
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
