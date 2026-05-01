// Commands/* 폴더에 넣어주세요

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dobak_Schema = require("../../models/dobak");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("잔액")
    .setDescription("도박 잔액을 확인한다냥")
    .addUserOption((f) =>
      f
        .setName("유저")
        .setDescription("유저를 입력해 주라냥")
        .setRequired(false)
    ),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser("유저") || interaction.user;
    const dobak_find = await dobak_Schema.findOne({ userid: user.id });
    if (!dobak_find) {
      return interaction.editReply({ content: `**가입하지 않은 유저이다냥**` });
    }
    const ranking =
      (
        await dobak_Schema
          .find()
          .sort([["money", "descending"]])
          .limit(500)
          .exec()
      ).findIndex((i) => i.userid == user.id) + 1; // Fixed: should be user.id, not interaction.user.id
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setAuthor({
        name: user.tag,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(`**\`${user.tag}\`**님의 도박 정보인것이다냥!`)
      .addFields(
        { name: "잔액", value: `${dobak_find.money.toLocaleString("ko-KR")}원` },
        { name: "순위", value: `${ranking}위` }
      );
    interaction.editReply({
      embeds: [embed],
    });
  },
};
