import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  EmbedBuilder,
  time,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import levelDB from "../../models/LevelSystem.js";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("너님정보")
    .setType(ApplicationCommandType.User),
  /**
   * @param {import("discord.js").UserContextMenuCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const targetUser = interaction.targetUser;
    const targetMember = interaction.targetMember;
    const guildId = interaction.guildId;

    // Fetch level data
    const levelData = await levelDB.findOne({ GuildID: guildId, UserID: targetUser.id }).lean();
    const level = levelData?.level || 1;
    const xp = levelData?.xp || 0;

    const badges = targetUser.flags.toArray().join(", ") || "없음";
    const botStatus = targetUser.bot ? "🤖 봇이다냥" : "👤 사람이다냥";
    
    // Roles (excluding @everyone)
    const roles = targetMember?.roles.cache
      .filter(r => r.name !== "@everyone")
      .map(r => r.toString())
      .join(", ") || "없음";

    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: `${targetUser.username}님의 프로필 정보`, 
        iconURL: targetUser.displayAvatarURL({ dynamic: true }) 
      })
      .setTitle(`🪐 유저 프로필 카드`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
      .setColor(targetMember?.displayHexColor || "#FFB6C1")
      .addFields(
        { name: "🆔 아이디", value: `\`${targetUser.id}\``, inline: true },
        { name: "🔖 이름", value: `**${targetUser.tag}**`, inline: true },
        { name: "🤖 존재 유형", value: botStatus, inline: true },
      )
      .addFields(
        { name: "📊 레벨 정보", value: `**Lv.${level}** (${xp.toLocaleString()} XP)`, inline: true },
        { name: "📅 가입 시점", value: `${time(targetUser.createdAt, 'R')}`, inline: true },
        { name: "📥 서버 가입", value: targetMember ? `${time(targetMember.joinedAt, 'R')}` : "정보 없음", inline: true },
      )
      .addFields(
        { name: "🛡️ 뱃지", value: badges, inline: false },
        { name: "🎭 역할", value: roles.length > 1024 ? roles.substring(0, 1021) + "..." : roles }
      )
      .setFooter({ text: `Natsumi Ultimate Core v5.2.2 | ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`UserInfoAvatar_${targetUser.id}`)
        .setLabel("아바타")
        .setEmoji("🖼️")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`UserInfoLevel_${targetUser.id}`)
        .setLabel("레벨 상세")
        .setEmoji("📊")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },
};
