// Commands/* 폴더에 넣어주세요

const moneycooltime = "60"; //돈받기 명령어 쿨타임을 정해주세요 | 1초 = 1
const moneygiveamount = 5000; //돈받기 명령어를 사용하면 받을 돈을 입력해 주세요 (""안에 넣지 마시고 그냥 숫자로 적어주세요)

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import dobak_Schema from "../../models/dobak.js";

export default {
  data: new SlashCommandBuilder()
    .setName("돈받기")
    .setDescription(`도박... 아니, 활동 자금 ${moneygiveamount.toLocaleString()} 냥을 줄게! 콘콘!`),
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
      dobak_find &&
      Math.round(new Date() / 1000) <
      dobak_find.date + Number(moneycooltime)
    ) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `**넌 무슨 돈을 그렇게 자주 받아가려고 해? 바보야? (<t:${
                dobak_find.date + Number(moneycooltime)
              }:R>) 이후에 다시 오라구! 흥!**`
            )
            .setColor("#ED4245")
            .setAuthor({
              name: `${interaction.user.username}`,
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
      .setColor("#FF7F50")
      .setDescription(
        `**${interaction.user.username}! 특별히 \`${moneygiveamount.toLocaleString(
          "ko-KR"
        )}\` 냥을 빌려주는 거야. \n딱히 널 걱정해서 주는 건 아니니까 착각하지 마! 콘콘!**`
      )
      .addFields(
        {
          name: "💰 현재 주머니",
          value: `\`${(
            (dobak_find?.money || 0) + Number(moneygiveamount)
          ).toLocaleString("ko-KR")}\` 냥`,
          inline: true
        },
        { name: "🏆 숲의 위계", value: `${ranking} 위`, inline: true }
      )
      .setAuthor({
        name: `${interaction.user.username}`,
        iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}`,
      });
    interaction.editReply({ embeds: [embed] });
  },
};
