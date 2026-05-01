const { PermissionFlagsBits } = require("discord.js");
const htmltrans = require("discord-html-transcripts");
const log_Table = require("../models/LogDB");

module.exports = {
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
        console.log("로그 전송 실패쓰");
      } else {
        const log_Find = await log_Table.findOne({
          guildId: interaction.guild.id,
        });
        interaction.guild.channels.cache.get(log_Find.channelId).send({
          content: `<@${interaction.channel.name.split("-")[1]}>님의 ${
            interaction.channel.name.split("-")[0]
          } 티켓이 종료되었다냥!`,
          files: [file],
        });
        interaction.channel.delete();
      }
    } else {
      interaction.reply({
        ephemeral: true,
        content: `**관리자 전용 버튼이다냥!**`,
      });
    }
  },
};
