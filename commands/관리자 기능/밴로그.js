const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../models/MemberLogdb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("로그설정")
    .setDescription(
      "유저가 밴 또는 추방 당했을 때 로그를 전송할 채널을 설정하는 명령어"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((op) =>
      op
        .setName("채널")
        .setDescription("로그를 전송 할 채널을 선택하세요")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const channel = interaction.options.getChannel("채널");
    const db_find = await db.findOne({ guildId: interaction.guildId });
    if (db_find) {
      await db.updateOne(
        { guildId: interaction.guildId },
        { channelId: channel.id }
      );
    } else {
      const DB = new db({
        guildId: interaction.guildId,
        channelId: channel.id,
      });
      DB.save();
    }
    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `멤버 추방, 밴 로그가 전송될 채널이 ${channel} 채널로 설정되었다냥`
          )
          .setColor("Green"),
      ],
    });
  },
};
