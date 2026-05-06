// Commands/* 폴더에 넣어주세요

import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import dobak_Schema from "../../models/dobak.js";

export default {
  data: new SlashCommandBuilder()
    .setName("순위")
    .setDescription("이 숲에서 누가 제일 부자인지 보여줄게! (별로 안 궁금하겠지만!)"),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) { 
    await interaction.deferReply();
    const find = await dobak_Schema
      .find()
      .sort([["money", "descending"]])
      .limit(10)
      .exec();
      
    if (find.length == 0) {
      return interaction.editReply({ content: `**흥! 아직 주머니에 먼지만 가득한가 봐? (기록 없음)**` });
    }
    
    const embed = new EmbedBuilder()
      .setTitle("🏆 숲의 지존 부자들 (Top 10)")
      .setDescription("이 녀석들은 대체 뭘 하고 다니길래 돈이 이렇게 많아? \n나한테 주지도 않을 거면서 말이야! 콘콘!")
      .setColor("#FFD700")
      .setTimestamp();
      
    for (let i = 0; i < find.length; i++) {
      try {
        const user = await interaction.client.users.fetch(find[i].userid);
        if (i == 0) {
          embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
        }
        embed.addFields({
          name: `${i === 0 ? '🦊' : i + 1 + '.'} ${user.username}`,
          value: `**${(find[i].money || 0).toLocaleString("ko-KR")}** 금전`,
        });
      } catch (e) {
        embed.addFields({
          name: `${i + 1}. 어딘가의 인간`,
          value: `**${(find[i].money || 0).toLocaleString("ko-KR")}** 금전`,
        });
      }
    }
    interaction.editReply({ embeds: [embed] });
  },
};
