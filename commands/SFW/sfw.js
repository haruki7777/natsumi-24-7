
//Commands/* 폴더에 넣어주세요
//실행전에 npm i axios 터미널에 입력해 주세요

const axios = require("axios");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const base_url = "https://api.waifu.pics/sfw";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sfw")
    .setDescription("sfw 짤을 보여줍니다")
    .addStringOption((f) =>
      f
        .setName("카테고리")
        .setDescription("카테고리를 선택해 주세요")
        .setRequired(true)
        .addChoices(
          { name: "와이프", value: "waifu" },
          { name: "네코", value: "neko" },
          { name: "괴롭히기", value: "bully" },
          { name: "껴안기", value: "cuddle" },
          { name: "울기", value: "cry" },
          { name: "허그", value: "hug" },
          { name: "어우", value: "awoo" },
          { name: "키스", value: "kiss" },
          { name: "핥기", value: "lick" },
          { name: "두드리기", value: "pat" },
          { name: "잘난척", value: "smug" },
          { name: "스마일", value: "smile" },
          { name: "하이파이브", value: "highfive" },
          { name: "손잡이", value: "handhold" },
          { name: "놈", value: "nom" },
          { name: "깨물기", value: "bite" },
          { name: "글럼프", value: "glomp" },
          { name: "싸대기", value: "slap" },
          { name: "죽이다", value: "kill" },
          { name: "발차기", value: "kick" },
          { name: "행복", value: "happy" },
          { name: "윙크", value: "wink" },
          { name: "찌르기", value: "poke" },
          { name: "댄스", value: "dance" },
          { name: "움츠리다", value: "cringe" }
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
      .setTitle(
        `오 님의 취향은 ${category} 이군요취향존중 <a:KemomimiDance:1048568057599119370>`
      )
      .setTimestamp()
      .setColor("Random")
      .setImage(`${getimage.url}`);
    interaction.editReply({ embeds: [embed] });
  },
};
