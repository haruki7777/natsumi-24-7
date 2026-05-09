import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const canModerate = (interaction, member, action) => {
  if (!member) return "서버에서 해당 멤버를 찾을 수 없어요.";
  if (member.id === interaction.user.id) return "자기 자신에게는 사용할 수 없어요.";
  if (member.id === interaction.guild.ownerId) return "서버 소유자는 처리할 수 없어요.";
  if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 && interaction.guild.ownerId !== interaction.user.id) {
    return "나보다 같거나 높은 역할의 멤버는 처리할 수 없어요.";
  }
  if (interaction.guild.members.me.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
    return `나츠미 역할이 대상보다 낮아서 ${action}할 수 없어요.`;
  }
  return null;
};

export default {
  data: new SlashCommandBuilder()
    .setName("밴")
    .setDescription("멤버를 서버에서 차단해요.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option.setName("대상").setDescription("차단할 멤버를 선택해줘.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("사유").setDescription("차단 사유를 적어줘.").setMaxLength(512)
    )
    .addIntegerOption((option) =>
      option
        .setName("메시지삭제일")
        .setDescription("최근 며칠치 메시지를 같이 지울지 선택해줘.")
        .setMinValue(0)
        .setMaxValue(7)
    )
    .addBooleanOption((option) =>
      option.setName("dm알림").setDescription("대상에게 차단 안내 DM을 보낼까요?")
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser("대상", true);
    const reason = interaction.options.getString("사유") || "사유 없음";
    const deleteDays = interaction.options.getInteger("메시지삭제일") ?? 0;
    const sendDm = interaction.options.getBoolean("dm알림") ?? true;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const blockReason = canModerate(interaction, member, "차단");
    if (blockReason) return interaction.editReply({ content: `**${blockReason}**` });
    if (!member.bannable) return interaction.editReply({ content: "**내 권한으로는 이 멤버를 차단할 수 없어요.**" });

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("멤버 차단 완료")
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "대상", value: `${user} (${user.tag})\nID: ${user.id}` },
        { name: "처리자", value: `${interaction.user} (${interaction.user.tag})` },
        { name: "사유", value: reason },
        { name: "삭제된 메시지 범위", value: `${deleteDays}일` }
      )
      .setTimestamp();

    if (sendDm) {
      await user.send({ embeds: [embed] }).catch(() => null);
    }

    await member.ban({
      reason: `${interaction.user.tag}: ${reason}`,
      deleteMessageSeconds: deleteDays * 24 * 60 * 60,
    });

    return interaction.editReply({ embeds: [embed] });
  },
};
