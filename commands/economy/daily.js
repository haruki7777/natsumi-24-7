// Commands/* 폴더에 넣어주세요

const moneycooltime = "86400"; //출석체크 명령어 쿨타임을 정해주세요 | 1초 = 1
const moneygiveamount = 2000; // 2000원 지급

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import dailycheck_Schema from "../../models/dailycheck.js";
import dobak_Schema from "../../models/dobak.js";
import { addXP } from "../../events/levels.js";

export default {
  data: new SlashCommandBuilder()
    .setName("출석체크")
    .setDescription(
      `출석체크를 하고 돈 ${moneygiveamount.toLocaleString()}원과 경험치를 드린다냥!`
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

    // 1. Give XP
    if (interaction.guildId) {
        await addXP(interaction.guildId, interaction.user.id, 50, interaction); // Give 50 XP per check-in
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
      .setTitle("📅 나츠미의 출석체크!")
      .setDescription(
        `**${
          (dailycheck_find?.count || 0) + 1
        }일 째 출석체크를 완료했다냥!**\n\n💵 **지급 금액:** \`${moneygiveamount.toLocaleString()}\`원\n✨ **경험치:** \`50 XP\``
      )
      .addFields({
        name: "현재 잔액",
        value: `\`${currentMoney.toLocaleString()}\`원`,
        inline: true
      })
      .addFields({
        name: "총 출석 일수",
        value: `\`${(dailycheck_find?.count || 0) + 1}\`일`,
        inline: true
      })
      .setAuthor({
        name: `${interaction.user.tag}`,
        iconURL: `${interaction.user.displayAvatarURL({
          dynamic: true,
        })}`,
      })
      .setTimestamp();
    interaction.editReply({ embeds: [embed] });
  },
};
