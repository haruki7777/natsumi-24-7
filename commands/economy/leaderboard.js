// Commands/* 폴더에 넣어주세요

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const dobak_Schema = require("../../models/dobak");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("순위")
    .setDescription("도박 순위를 보여준다냥!"),
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
      return interaction.editReply({ content: `**순위 정보가 없다냥!**` });
    }
    
    const embed = new EmbedBuilder()
      .setTitle("🏆 도박 순위표 (Top 10)")
      .setColor("Gold")
      .setTimestamp();
      
    for (let i = 0; i < find.length; i++) {
      try {
        const user = await interaction.client.users.fetch(find[i].userid);
        if (i == 0) {
          embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
        }
        embed.addFields({
          name: `${i + 1}. ${user.tag}`,
          value: `**${(find[i].money || 0).toLocaleString("ko-KR")}**원`,
        });
      } catch (e) {
        embed.addFields({
          name: `${i + 1}. 알 수 없는 유저`,
          value: `**${(find[i].money || 0).toLocaleString("ko-KR")}**원`,
        });
      }
    }
    interaction.editReply({ embeds: [embed] });
  },
};
