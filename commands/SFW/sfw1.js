//Commands/* 폴더에 넣어주세요
//실행전에 npm i axios 터미널에 입력해 주세요

const axios = require("axios");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const base_url = "https://api.waifu.pics/sfw";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sfw2")
    .setDescription("sfw 짤을 보여줍니다")
    .addStringOption((f) =>
      f
        .setName("카테고리")
        .setDescription("카테고리를 선택해 주세요")
        .setRequired(true)
        .addChoices(
          { name: "시노부", value: "shinobu" },
          { name: "메구밍", value: "megumin" },
          { name: "돈벌기", value: "bonk" },
          { name: "아직", value: "yeet" },
          { name: "얼굴을 붉히다", value: "blush" },
          { name: "웨이브", value: "wave" } 
        )
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) { 
    await interaction.deferReply();
    const category = interaction.options.getString("카테고리");
    const getimage = (await axios.get(`${base_url}/${category}`)).data;
    const embed = new EmbedBuilder()
      .setTitle(`오 님의 취향은 ${category} 이군요취향존중 <a:KemomimiDance:1048568057599119370>`)
      .setTimestamp()
      .setColor("Random")
      .setImage(`${getimage.url}`);
    interaction.editReply({ embeds: [embed] });
  },
};
