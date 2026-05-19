import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  time,
} from "discord.js";
import levelDB from "../../models/LevelSystem.js";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("유저정보")
    .setType(ApplicationCommandType.User),

  /**
   * @param {import("discord.js").UserContextMenuCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.targetUser;
    const member = interaction.guild
      ? await interaction.guild.members.fetch(targetUser.id).catch(() => null)
      : interaction.targetMember;
    const fullUser = await interaction.client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser);
    const levelData = interaction.guildId
      ? await levelDB.findOne({ GuildID: interaction.guildId, UserID: targetUser.id }).lean().catch(() => null)
      : null;
    const bannerUrl = fullUser.bannerURL({ size: 1024, dynamic: true });
    const avatarUrl = fullUser.displayAvatarURL({ size: 1024, dynamic: true });
    const roles = member?.roles.cache
      .filter((role) => role.name !== "@everyone")
      .sort((a, b) => b.position - a.position)
      .first(8)
      .map((role) => role.toString())
      .join(", ") || "없음";

    const embed = new EmbedBuilder()
      .setColor("#ff9f43")
      .setAuthor({ name: `${fullUser.username} 프로필`, iconURL: avatarUrl })
      .setTitle("나츠미 유저정보")
      .setThumbnail(avatarUrl)
      .addFields(
        { name: "유저", value: `${fullUser} \`${fullUser.tag || fullUser.username}\``, inline: false },
        { name: "ID", value: `\`${fullUser.id}\``, inline: true },
        { name: "레벨", value: `Lv.${levelData?.level || 1} / ${Number(levelData?.xp || 0).toLocaleString()} XP`, inline: true },
        { name: "계정 생성", value: time(fullUser.createdAt, "R"), inline: true },
        { name: "서버 입장", value: member?.joinedAt ? time(member.joinedAt, "R") : "서버 정보 없음", inline: true },
        { name: "주요 역할", value: roles.length > 1024 ? `${roles.slice(0, 1020)}...` : roles, inline: false },
        { name: "배너", value: bannerUrl ? "버튼으로 확인 가능" : "설정된 배너 없음", inline: true },
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
