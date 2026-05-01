const {
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
  } = require("discord.js");
  const log_Table = require("../../models/LogDB");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("티켓로그설정")
      .setDescription("티켓이 닫힌 후 로그를 전송 할 채널을 설정한다냥")
      .addChannelOption((op) =>
        op
          .setName("채널")
          .setDescription("로그 채널을 선택해주라냥")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    /**
     *
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    ephemeral: true,
    async execute(interaction) {
      await interaction.deferReply();
      const channel = interaction.options.getChannel("채널");
      const log_Find = await log_Table.findOne({ guildId: interaction.guild.id });
      if (!log_Find) {
        let newLog = new log_Table({
          guildId: interaction.guild.id,
          channelId: channel.id,
        });
        newLog.save();
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${channel} 채널로 티켓 로그설정이 완료되었다냥`)
              .setColor("Orange"),
          ],
        });
      } else {
        await log_Table.findOneAndUpdate({
          guildId: interaction.guild.id,
          channelId: channel.id,
        });
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${channel} 채널로 티켓 로그설정 채널이 업데이트 되었다냥`
              )
              .setColor("Orange"),
          ],
        });
      }
    },
  };
  