// Commands/* 폴더에 넣어주세요

const { EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
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
      .exec();
    if (find.length == 0) {
      return interaction.editReply({ content: `**나츠미 로딩중!**` });
    }
    const embed = new EmbedBuilder()
      .setTitle("도박 순위표")
      .setColor("Random")
      .setTimestamp();
    for (let i = 0; i < find.length; i++) {
      const user = await interaction.client.users.fetch(find[i].userid);
      if (i == 0) {
        embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
      }
      embed.addFields({
        name: `${i + 1}. ${user.tag}`,
        value: `**${find[i].money.toLocaleString("ko-KR")}**원`,
      });
    }
    interaction.editReply({ embeds: [embed] });
  },
};
