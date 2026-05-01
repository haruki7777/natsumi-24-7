const fetch = require("node-fetch");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("애니짤")
    .setDescription("귀여운 애니메이션 이미지를 보여준다냥!")
    .addStringOption((f) =>
      f
        .setName("카테고리")
        .setDescription("카테고리를 선택해주라냥")
        .setRequired(true)
        .addChoices(
          { name: "Waifu", value: "waifu" },
          { name: "Neko", value: "neko" },
          { name: "캐치", value: "cringe" },
          { name: "허그", value: "hug" },
          { name: "키스", value: "kiss" },
          { name: "핥기", value: "lick" },
          { name: "쓰다듬기", value: "pat" },
          { name: "찌르기", value: "poke" },
          { name: "슬랩", value: "slap" },
          { name: "스마일", value: "smile" },
          { name: "윙크", value: "wink" }
        )
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const category = interaction.options.getString("카테고리");

    try {
      const response = await fetch(`https://api.waifu.pics/sfw/${category}`);
      const data = await response.json();

      const embed = new EmbedBuilder()
        .setTitle(`✨ ${category}!! 귀엽다냥!`)
        .setTimestamp()
        .setColor("Random")
        .setImage(data.url);

      interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      interaction.editReply({ content: "**이미지를 가져오지 못했다냥!**" });
    }
  },
};
