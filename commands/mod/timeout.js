import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("타임아웃")
    .setDescription("시끄러운 인간들을 조용히 시켜볼까? 콘콘!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("유저")
        .setDescription("조용히 시킬 녀석을 골라봐!")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("시간")
        .setDescription("몇 초 동안 입을 막아버릴까? (예: 60)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("사유")
        .setDescription("왜 조용히 시키는 거야? 사유를 적어!")
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
      return interaction.editReply({ content: "흥! 그런 녀석은 이 숲에 없는데?" });
    }

    try {
      // time is in seconds, timeout expects milliseconds
      await member.timeout(time * 1000, reason);
      await interaction.editReply({
        content: `**<@!${member.id}>**! 넌 너무 시끄러워서 ${time}초 동안 강제로 조용히 하게 했어! \n사유: ${reason}`,
      });
    } catch (e) {
      console.error(e);
      await interaction.editReply({
        content: "흥, 내 영력이 부족한 건지 저 녀석이 너무 강한 건지 모르겠네! (권한 부족 혹은 오류)",
      });
    }
  },
};
