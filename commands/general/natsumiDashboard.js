import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const DASHBOARD_URL = process.env.NATSUMI_DASHBOARD_URL || process.env.DASHBOARD_URL || "https://haruki7777.github.io/natsumi-dashboard/";

export default {
  data: new SlashCommandBuilder()
    .setName("나츠미서버설정")
    .setDescription("나츠미 대시보드에서 서버 설정을 관리해요.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guildParam = interaction.guildId ? `?guild=${encodeURIComponent(interaction.guildId)}` : "";
    const dashboardUrl = `${DASHBOARD_URL.replace(/\/$/, "")}/${guildParam}`;

    const embed = new EmbedBuilder()
      .setColor("#ff7aa8")
      .setTitle("나츠미 서버 설정")
      .setDescription([
        "레벨 설정, 환영인사, TTS, 기능 켜기/끄기는 대시보드에서 관리해요.",
        "관리자 권한이 있는 서버만 대시보드에 표시돼요.",
      ].join("\n"))
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("대시보드 열기")
        .setStyle(ButtonStyle.Link)
        .setURL(dashboardUrl)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
