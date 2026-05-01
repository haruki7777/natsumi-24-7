//Commands/* 폴더에 넣어주세요
//실행전에 npm i axios 터미널에 입력해 주세요

const axios = require("axios");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const base_url = "https://api.waifu.pics/nsfw";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nsfw")
    .setDescription("nsfw 짤을 보여줍니다")
    .addStringOption((f) =>
      f
        .setName("카테고리")
        .setDescription("카테고리를 선택해 주세요")
        .setRequired(true)
        .addChoices(
          { name: "와이프", value: "waifu" },
          { name: "네코", value: "neko" },
          { name: "트랍", value: "trap" },
          { name: "입", value: "blowjob" }
        )
    ),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {import("discord.js").Client} client
   */
  async execute(interaction) {
    await interaction.deferReply();
    const embed1 = new EmbedBuilder()
      .setDescription(
        "**채널 설정에서 연령 제한 채널을 확인하십시오.**\n**아래 사진처럼 되있어야 합니다.**"
      )
      .setColor("Red")
      .setImage(
        "https://media.discordapp.net/attachments/1039100418631942164/1041239052839559198/image.png"
      );
    if (interaction.channel.nsfw == false) {
      return interaction.editReply({
        embeds: [embed1],
      });
    }
    const category = interaction.options.getString("카테고리");
    const getimage = (await axios.get(`${base_url}/${category}`)).data;
    const embed = new EmbedBuilder()
      .setTitle(`당신이 ${category} 를 선택했어요 변태 <a:Blonde_Neko_ThumbsUp:1038252691295572069>`)
      .setTimestamp()
      .setColor("Random")
      .setImage(`${getimage.url}`);
    interaction.editReply({ embeds: [embed] });
  },
};
