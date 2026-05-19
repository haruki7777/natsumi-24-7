import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  time,
} from "discord.js";

const statusLabel = {
  online: "온라인",
  idle: "자리 비움",
  dnd: "방해 금지",
  offline: "오프라인",
};

export default {
  data: new SlashCommandBuilder()
    .setName("유저정보")
    .setDescription("유저의 프로필, 서버 정보, 배너를 확인해요.")
    .addUserOption((option) =>
      option
        .setName("유저")
        .setDescription("확인할 유저를 선택해줘.")
        .setRequired(false),
    ),

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("유저") || interaction.user;
    const member = interaction.guild
      ? await interaction.guild.members.fetch(targetUser.id).catch(() => null)
      : null;
    const fullUser = await interaction.client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser);
    const bannerUrl = fullUser.bannerURL({ size: 1024, dynamic: true });
    const avatarUrl = fullUser.displayAvatarURL({ size: 1024, dynamic: true });
    const highestRole = member?.roles.highest?.id === interaction.guildId ? "없음" : member?.roles.highest?.toString() || "없음";
    const joinedAt = member?.joinedAt ? time(member.joinedAt, "R") : "서버 정보 없음";
    const status = statusLabel[member?.presence?.status] || "확인 안 됨";

    const embed = new EmbedBuilder()
      .setColor("#ff7ab6")
      .setAuthor({ name: `${fullUser.username} 프로필`, iconURL: avatarUrl })
      .setTitle("나츠미 유저정보")
      .setThumbnail(avatarUrl)
      .addFields(
        { name: "유저", value: `${fullUser} \`${fullUser.tag || fullUser.username}\``, inline: false },
        { name: "ID", value: `\`${fullUser.id}\``, inline: true },
        { name: "계정 생성", value: time(fullUser.createdAt, "R"), inline: true },
        { name: "서버 입장", value: joinedAt, inline: true },
        { name: "상태", value: status, inline: true },
        { name: "최고 역할", value: highestRole, inline: true },
        { name: "배너", value: bannerUrl ? "아래 버튼으로 확인할 수 있어." : "설정된 배너가 없어.", inline: true },
      )
      .setFooter({ text: `요청자: ${interaction.user.username}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("아바타 보기").setStyle(ButtonStyle.Link).setURL(avatarUrl),
    );
    if (bannerUrl) {
      row.addComponents(new ButtonBuilder().setLabel("배너 보기").setStyle(ButtonStyle.Link).setURL(bannerUrl));
      embed.setImage(bannerUrl);
    }

    await interaction.editReply({ embeds: [embed], components: [row] });
  },
};
