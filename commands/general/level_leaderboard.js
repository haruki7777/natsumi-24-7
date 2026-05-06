import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import levelDB from "../../models/LevelSystem.js";

export default {
  data: new SlashCommandBuilder()
    .setName("레벨순위")
    .setDescription("이 숲에서 누가 제일 대단한지 보여줄게! 콘콘! 누가 제일 고인물이야?"),
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
      return interaction.editReply({ content: `**흥! 아직 숲에 발자취를 남긴 녀석이 하나도 없네? 바보들만 모인 거야?**` });
    }
    
    const embed = new EmbedBuilder()
      .setTitle("🏮 숲의 명예의 전당 (위계 순위)")
      .setColor("#FF7F50")
      .setDescription("콘콘! 다들 내 눈에 들려고 꽤나 노력했나 보네? \n**딱히 기특하다고 생각하는 건 아니지만!**")
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
