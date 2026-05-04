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
    const now = new Date();
    
    // 9 AM KST is 00:00 UTC
    const today9AmKst = new Date(now);
    today9AmKst.setUTCHours(0, 0, 0, 0);

    let lastResetUtc, nextResetUtc;
    if (now < today9AmKst) {
      // It's currently before 9 AM KST
      lastResetUtc = new Date(today9AmKst.getTime() - 24 * 60 * 60 * 1000);
      nextResetUtc = today9AmKst;
    } else {
      // It's currently after 9 AM KST
      lastResetUtc = today9AmKst;
      nextResetUtc = new Date(today9AmKst.getTime() + 24 * 60 * 60 * 1000);
    }

    const lastResetSeconds = Math.round(lastResetUtc.getTime() / 1000);
    const nextResetSeconds = Math.round(nextResetUtc.getTime() / 1000);
    const nowSeconds = Math.round(now.getTime() / 1000);

    const dailycheck_find = await dailycheck_Schema.findOne({
      userid: interaction.user.id,
    });

    if (dailycheck_find && dailycheck_find.date >= lastResetSeconds) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `**오늘 출석체크는 이미 완료했다냥! ㅋㅋㅋ 욕심쟁이 알박기 금지다냥!**\n\n⏰ **다음 리셋 (KST):** <t:${nextResetSeconds}:R> (<t:${nextResetSeconds}:F>)\n\n한국 표준시(KST) 기준 **매일 오전 9시**에 새로운 출석이 가능해진다냥! 조금만 더 기다려달라냥~!`
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
          date: nowSeconds,
        }
      );
    } else {
      await new dailycheck_Schema({
        userid: interaction.user.id,
        count: 1,
        date: nowSeconds,
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
