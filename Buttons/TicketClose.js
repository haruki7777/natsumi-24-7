import { PermissionFlagsBits } from "discord.js";
import htmltrans from "discord-html-transcripts";
import log_Table from "../models/LogDB.js";

export default {
  name: "close",
  /**
   *
   * @param {import("discord.js").ButtonInteraction} interaction
   */
  async execute(interaction) {
    if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      const file = await htmltrans.createTranscript(interaction.channel, {
        limit: -1,
        filename: `ticketlog.html`,
        returnType: "attachment",
        saveImages: false,
      });
      const log_Find = await log_Table.findOne({
        guildId: interaction.guild.id,
      });
      if (!log_Find) {
        console.log("로그 설정이 되어있지 않아! (LogDB) 콘콘!");
        return interaction.channel.delete().catch(console.error);
      } else {
        const logChannel = interaction.guild.channels.cache.get(log_Find.channelId);
        if (logChannel) {
          const parts = interaction.channel.name.split("-");
          const targetId = parts[parts.length - 1];
          const targetName = parts.slice(0, -1).join("-") || interaction.channel.name;

          await logChannel.send({
            content: `🏮 <@${targetId}>의 소통 기록을 보관함에 넣었어! 숲의 대화 종료!`,
            files: [file],
          }).catch(console.error);
        }
        await interaction.channel.delete().catch(console.error);
      }
    } else {
      interaction.reply({
        ephemeral: true,
        content: `**흥! 이건 관리자 권한이 있는 분들만 누를 수 있는 거야! 바보!**`,
      });
    }
  },
};
