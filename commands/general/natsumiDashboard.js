import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const DASHBOARD_URL = process.env.NATSUMI_DASHBOARD_URL || process.env.DASHBOARD_URL || "http://natsumidashboard.kro.kr/";

export default {
  data: new SlashCommandBuilder()
    .setName("나츠미서버설정")
    .setDescription("나츠미 대시보드에서 서버 설정을 관리해요.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const dashboardUrl = new URL(DASHBOARD_URL);
    if (interaction.guildId) dashboardUrl.searchParams.set("guild", interaction.guildId);

    const embed = new EmbedBuilder()
      .setColor("#ff7aa8")
      .setTitle("나츠미 서버 설정")
      .setDescription([
        "레벨 설정, 환영인사, TTS, 기능 켜기/끄기는 대시보드에서 관리해요.",
        "대시보드에서 디스코드 로그인 후 관리자 권한이 있는 서버만 설정할 수 있어요.",
      ].join("\n"))
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("대시보드 열기")
        .setStyle(ButtonStyle.Link)
        .setURL(dashboardUrl.toString())
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
