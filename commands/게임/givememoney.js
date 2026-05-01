// Commands/* 폴더에 넣어주세요

const moneycooltime = "60"; //돈받기 명령어 쿨타임을 정해주세요 | 1초 = 1
const moneygiveamount = 5000; //돈받기 명령어를 사용하면 받을 돈을 입력해 주세요 (""안에 넣지 마시고 그냥 숫자로 적어주세요)

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dobak_Schema = require("../../models/dobak");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("돈받기")
    .setDescription(`도박을 할 수 있는 돈 ${moneygiveamount}원을 드린다냥`),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const dobak_find = await dobak_Schema.findOne({
      userid: interaction.user.id,
    });
    if (
      Math.round(new Date() / 1000) <
      dobak_find?.date + Number(moneycooltime)
    ) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `**돈받기 쿨타임이 적용 중이에요!! (<t:${
                dobak_find?.date + Number(moneycooltime)
              }:R>) 다시 시도해라냥**`
            )
            .setColor("Red")
            .setAuthor({
              name: `${interaction.user.tag}`,
              iconURL: `${interaction.user.displayAvatarURL({
                dynamic: true,
              })}`,
            }),
        ],
      });
    }
    if (dobak_find) {
      await dobak_Schema.updateOne(
        { userid: interaction.user.id },
        {
          money: dobak_find.money + Number(moneygiveamount),
          date: Math.round(new Date() / 1000),
        }
      );
    } else {
      await new dobak_Schema({
        userid: interaction.user.id,
        money: Number(moneygiveamount),
        date: Math.round(new Date() / 1000),
      }).save();
    }
    const ranking =
      (
        await dobak_Schema
          .find()
          .sort([["money", "descending"]])
          .limit(500)
          .exec()
      ).findIndex((i) => i.userid == interaction.user.id) + 1;
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setDescription(
        `**${interaction.user.username}님! \`${moneygiveamount.toLocaleString(
          "ko-KR"
        )}\`원을 지급해드렸다냥!!**`
      )
      .addFields(
        {
          name: "잔액",
          value: `${(
            (dobak_find?.money || 0) + Number(moneygiveamount)
          ).toLocaleString("ko-KR")}`,
        },
        { name: "순위", value: `${ranking}위` }
      )
      .setAuthor({
        name: `${interaction.user.tag}`,
        iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}`,
      });
    interaction.editReply({ embeds: [embed] });
  },
};
