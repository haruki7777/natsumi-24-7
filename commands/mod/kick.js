import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const canKick = (interaction, member) => {
  if (!member) return "서버에서 해당 멤버를 찾을 수 없어요.";
  if (member.id === interaction.user.id) return "자기 자신은 추방할 수 없어요.";
  if (member.id === interaction.guild.ownerId) return "서버 소유자는 추방할 수 없어요.";
  if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 && interaction.guild.ownerId !== interaction.user.id) {
    return "나보다 같거나 높은 역할의 멤버는 추방할 수 없어요.";
  }
  if (interaction.guild.members.me.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
    return "나츠미 역할이 대상보다 낮아서 추방할 수 없어요.";
  }
  return null;
};

export default {
  data: new SlashCommandBuilder()
    .setName("킥")
    .setDescription("멤버를 서버에서 추방해요.")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) =>
      option.setName("대상").setDescription("추방할 멤버를 선택해줘.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("사유").setDescription("추방 사유를 적어줘.").setMaxLength(512)
    )
    .addBooleanOption((option) =>
      option.setName("dm알림").setDescription("대상에게 추방 안내 DM을 보낼까요?")
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser("대상", true);
    const reason = interaction.options.getString("사유") || "사유 없음";
    const sendDm = interaction.options.getBoolean("dm알림") ?? true;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const blockReason = canKick(interaction, member);
    if (blockReason) return interaction.editReply({ content: `**${blockReason}**` });
    if (!member.kickable) return interaction.editReply({ content: "**내 권한으로는 이 멤버를 추방할 수 없어요.**" });

    const embed = new EmbedBuilder()
      .setColor("#FF8F3D")
      .setTitle("멤버 추방 완료")
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "대상", value: `${user} (${user.tag})\nID: ${user.id}` },
        { name: "처리자", value: `${interaction.user} (${interaction.user.tag})` },
        { name: "사유", value: reason }
      )
      .setTimestamp();

    if (sendDm) {
      await user.send({ embeds: [embed] }).catch(() => null);
    }

    await member.kick(`${interaction.user.tag}: ${reason}`);
    return interaction.editReply({ embeds: [embed] });
  },
};
