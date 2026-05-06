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
      `콘콘! 출석 도장 받고 용돈(${moneygiveamount.toLocaleString()}냥)이랑 영력을 챙겨가라구!`
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
            .setTitle("🦊 이미 도장 찍었잖아!")
            .setDescription(
              `**바보야! 오늘 이미 얼굴 비췄으면서 왜 또 와? 욕심이 너무 과하다구! ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ**\n\n⏰ **다음 방문 시간:** <t:${nextResetSeconds}:R> (<t:${nextResetSeconds}:F>)\n\n오전 9시까지는 꼼짝 말고 기다려! 알았어?`
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
      .setColor("#FF7F50")
      .setTitle("🏮 나츠미의 출석 장부")
      .setDescription(
        `**${
          (dailycheck_find?.count || 0) + 1
        }일 째 출석 완료!**\n\n콘콘! 자 여기 용돈이야. 허튼 데 쓰지 말고 잘 간직하라구? \n**아, 별로 널 위해서 주는 건 아니니까!**`
      )
      .addFields({
        name: "💰 챙겨준 냥",
        value: `\`${moneygiveamount.toLocaleString()}\` 냥`,
        inline: true
      })
      .addFields({
        name: "✨ 쌓인 영력",
        value: `\`50 XP\``,
        inline: true
      })
      .addFields({
        name: "\u200B",
        value: "\u200B",
        inline: false
      })
      .addFields({
        name: "📦 내 지갑",
        value: `\`${currentMoney.toLocaleString()}\` 냥`,
        inline: true
      })
      .addFields({
        name: "📅 성실함 점수",
        value: `\`${(dailycheck_find?.count || 0) + 1}\` 일`,
        inline: true
      })
      .setFooter({ text: "내일도 얼굴 안 비치면 꼬리로 확... 알지?" })
      .setTimestamp();
    interaction.editReply({ embeds: [embed] });
  },
};
