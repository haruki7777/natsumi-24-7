import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';

export default {
  data: new SlashCommandBuilder()
    .setName("sfw")
    .setDescription("귀여운 애니 짤을 보여준다냥")
    .addStringOption((f) =>
      f
        .setName("카테고리")
        .setDescription("카테고리를 선택하라냥")
        .setRequired(true)
        .addChoices(
          { name: "와이프", value: "waifu" },
          { name: "네코", value: "neko" },
          { name: "껴안기", value: "hug" },
          { name: "키스", value: "kiss" }
        )
    ),
  async execute(interaction) {
    const category = interaction.options.getString("카테고리");
    try {
      const response = await axios.get(`https://api.waifu.pics/sfw/${category}`);
      const embed = new EmbedBuilder()
        .setTitle(`따란! ${category} 짤이다냥!`)
        .setImage(response.data.url)
        .setColor("Random");
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply("짤을 가져오지 못했다냥..");
    }
  },
};
