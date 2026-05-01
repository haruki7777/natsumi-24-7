const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("타임아웃")
    .setDescription("시끄러운 냥이들을 조용히 시키자 ㅋㅋ")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("유저")
        .setDescription("조용히 시킬 냥이를 고르라냥")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("시간")
        .setDescription("시간을 초 단위로 지정해주라냥 | (예시) 1분→60 ")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("사유")
        .setDescription("조용히 시키는 이유를 입력하라냥")
        .setRequired(true)
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();

    const member = interaction.options.getMember("유저");
    const reason = interaction.options.getString("사유");
    const time = interaction.options.getInteger("시간");

    if (!member) {
      return interaction.editReply({ content: "유저를 찾을 수 없다냥!" });
    }

    try {
      // time is in seconds, timeout expects milliseconds
      await member.timeout(time * 1000, reason);
      await interaction.editReply({
        content: `**<@!${member.id}>** 유저가 ${time}초 동안 타임아웃 되었다냥! 사유: ${reason}`,
      });
    } catch (e) {
      console.error(e);
      await interaction.editReply({
        content: "권한이 부족하거나 오류가 발생해서 타임아웃을 할 수 없다냥!",
      });
    }
  },
};
