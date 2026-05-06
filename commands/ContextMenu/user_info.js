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
    const botStatus = targetUser.bot ? "🤖 자아가 없는 기계" : "👤 숨 쉬는 인간";
    
    // Roles (excluding @everyone)
    const roles = targetMember?.roles.cache
      .filter(r => r.name !== "@everyone")
      .map(r => r.toString())
      .join(", ") || "없음";

    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: `${targetUser.username}의 관찰 기록`, 
        iconURL: targetUser.displayAvatarURL({ dynamic: true }) 
      })
      .setTitle(`🪐 유저 프로필 카드`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
      .setColor("#FF7F50")
      .addFields(
        { name: "🆔 식별 부적", value: `\`${targetUser.id}\``, inline: true },
        { name: "🔖 이름", value: `**${targetUser.username}**`, inline: true },
        { name: "🤖 존재 유형", value: botStatus, inline: true },
      )
      .addFields(
        { name: "📊 숲의 서열", value: `**위계 ${level}** (${xp.toLocaleString()} 영력)`, inline: true },
        { name: "📅 세상에 태어남", value: `${time(targetUser.createdAt, 'R')}`, inline: true },
        { name: "📥 숲에 들어옴", value: targetMember ? `${time(targetMember.joinedAt, 'R')}` : "정보 없음", inline: true },
      )
      .addFields(
        { name: "🛡️ 명예의 징표", value: badges, inline: false },
        { name: "🎭 숲의 역할", value: roles.length > 1024 ? roles.substring(0, 1021) + "..." : roles }
      )
      .setFooter({ text: `나츠미의 비밀 관찰 일지 | ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`UserInfoAvatar_${targetUser.id}`)
        .setLabel("외모(아바타)")
        .setEmoji("🖼️")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`UserInfoLevel_${targetUser.id}`)
        .setLabel("서열 상세")
        .setEmoji("📊")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },
};
