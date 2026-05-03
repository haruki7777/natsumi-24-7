// Commands/* 폴더에 넣어주세요

const moneycooltime = "86400"; //출석체크 명령어 쿨타임을 정해주세요 | 1초 = 1
const moneygiveamount = 5000; //출석체크 명령어를 사용하면 받을 돈을 입력해 주세요 (""안에 넣지 마시고 그냥 숫자로 적어주세요)

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import dailycheck_Schema from "../../models/dailycheck.js";
import dobak_Schema from "../../models/dobak.js";

export default {
  data: new SlashCommandBuilder()
    .setName("출석체크")
    .setDescription(
      `출석체크를 하고 도박을 할 수 있는 돈 ${moneygiveamount}원을 드린다냥`
    ),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const dailycheck_find = await dailycheck_Schema.findOne({
      userid: interaction.user.id,
    });
    if (
      dailycheck_find &&
      Math.round(new Date() / 1000) <
      dailycheck_find.date + Number(moneycooltime)
    ) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `**출석체크 쿨타임이 적용 중이다냥! (<t:${
                dailycheck_find.date + Number(moneycooltime)
              }:R>) 다시 시도해주라냥!**`
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

    if (dailycheck_find) {
      await dailycheck_Schema.updateOne(
        { userid: interaction.user.id },
        {
          count: dailycheck_find.count + 1,
          date: Math.round(new Date() / 1000),
        }
      );
    } else {
      await new dailycheck_Schema({
        userid: interaction.user.id,
        count: 1,
        date: Math.round(new Date() / 1000),
      }).save();
    }

    let dobak_find = await dobak_Schema.findOne({
      userid: interaction.user.id,
    });

    if (dobak_find) {
      await dobak_Schema.updateOne(
        { userid: interaction.user.id },
        {
          money: dobak_find.money + moneygiveamount,
        }
      );
      dobak_find.money += moneygiveamount;
    } else {
      dobak_find = await new dobak_Schema({
        userid: interaction.user.id,
        money: Number(moneygiveamount),
        date: Math.round(new Date() / 1000),
      }).save();
    }

    const currentMoney = dobak_find.money;

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(
        `**${
          (dailycheck_find?.count || 0) + 1
        }번 째 출석체크를 완료하여 \`${moneygiveamount.toLocaleString(
          "ko-KR"
        )}\`원을 지급했다냥!**`
      )
      .addFields({
        name: "잔액",
        value: `${currentMoney.toLocaleString("ko-KR")}원`,
      })
      .setAuthor({
        name: `${interaction.user.tag}`,
        iconURL: `${interaction.user.displayAvatarURL({
          dynamic: true,
        })}`,
      });
    interaction.editReply({ embeds: [embed] });
  },
};
