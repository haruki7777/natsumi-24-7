import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("청소")
    .setDescription("채널 메시지를 정리해요.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName("개수")
        .setDescription("삭제할 메시지 개수. 1~100개까지 가능해요.")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption((option) =>
      option.setName("대상").setDescription("특정 유저의 메시지만 지울 때 선택해줘.")
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const amount = interaction.options.getInteger("개수", true);
    const target = interaction.options.getUser("대상");
    const fetched = await interaction.channel.messages.fetch({ limit: Math.min(amount + 25, 100) });
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    const deletable = fetched
      .filter((message) => !target || message.author.id === target.id)
      .filter((message) => message.createdTimestamp > twoWeeksAgo)
      .first(amount);

    if (!deletable.length) {
      return interaction.editReply({
        content: target
          ? `**${target}님의 삭제 가능한 최근 메시지를 찾지 못했어요.**`
          : "**삭제 가능한 최근 메시지를 찾지 못했어요.**",
      });
    }

    const deleted = await interaction.channel.bulkDelete(deletable, true);
    const skipped = amount - deleted.size;

    const embed = new EmbedBuilder()
      .setColor("#FF8F3D")
      .setTitle("메시지 청소 완료")
      .setDescription(`총 **${deleted.size}개**의 메시지를 삭제했어요.`)
      .addFields(
        { name: "요청 개수", value: `${amount}개`, inline: true },
        { name: "삭제 개수", value: `${deleted.size}개`, inline: true },
        { name: "대상", value: target ? `${target}` : "전체", inline: true }
      )
      .setFooter({ text: skipped > 0 ? "일부 메시지는 14일 제한 또는 조건 때문에 건너뛰었어요." : "이 안내는 임시 메시지예요." })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};
