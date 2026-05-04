import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import levelDB from "../../models/LevelSystem.js";

export default {
  data: new SlashCommandBuilder()
    .setName("레벨순위")
    .setDescription("전체 레벨 순위를 보여준다냥! 누가 제일 고인물인가냥?"),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) { 
    await interaction.deferReply();
    
    // Sort by level descending, then xp descending
    const topLevels = await levelDB
      .find({ GuildID: interaction.guildId })
      .sort({ level: -1, xp: -1 })
      .limit(10)
      .lean();
      
    if (topLevels.length === 0) {
      return interaction.editReply({ content: `**아직 레벨 기록이 하나도 없다냥!**` });
    }
    
    const embed = new EmbedBuilder()
      .setTitle("👑 명예의 전당 (레벨 순위)")
      .setColor("Purple")
      .setDescription("세상에나... 다들 정말 열심히 활동 중이다냥!")
      .setTimestamp();
      
    for (let i = 0; i < topLevels.length; i++) {
      try {
        const user = await interaction.client.users.fetch(topLevels[i].UserID);
        if (i === 0) {
          embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
        }
        embed.addFields({
          name: `${i + 1}위 - ${user.username}`,
          value: `🥈 **레벨 ${topLevels[i].level}** (XP: ${topLevels[i].xp.toLocaleString()})`,
        });
      } catch (e) {
        embed.addFields({
          name: `${i + 1}위 - 알 수 없는 유저`,
          value: `🥈 **레벨 ${topLevels[i].level}** (XP: ${topLevels[i].xp.toLocaleString()})`,
        });
      }
    }
    
    await interaction.editReply({ embeds: [embed] });
  },
};
