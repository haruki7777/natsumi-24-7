import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const MAX_TIMEOUT_SECONDS = 28 * 24 * 60 * 60;

const canTimeout = (interaction, member) => {
  if (!member) return "서버에서 해당 멤버를 찾을 수 없어요.";
  if (member.id === interaction.user.id) return "자기 자신에게는 타임아웃을 걸 수 없어요.";
  if (member.id === interaction.guild.ownerId) return "서버 소유자는 타임아웃할 수 없어요.";
  if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 && interaction.guild.ownerId !== interaction.user.id) {
    return "나보다 같거나 높은 역할의 멤버는 타임아웃할 수 없어요.";
  }
  if (interaction.guild.members.me.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
    return "나츠미 역할이 대상보다 낮아서 타임아웃할 수 없어요.";
  }
  return null;
};

const formatDuration = (seconds) => {
  const units = [
    ["일", 86400],
    ["시간", 3600],
    ["분", 60],
    ["초", 1],
  ];
  const parts = [];
  let rest = seconds;
  for (const [label, size] of units) {
    const value = Math.floor(rest / size);
    if (value) {
      parts.push(`${value}${label}`);
      rest %= size;
    }
  }
  return parts.join(" ") || "0초";
};

export default {
  data: new SlashCommandBuilder()
    .setName("타임아웃")
    .setDescription("멤버에게 일정 시간 타임아웃을 걸어요.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("대상").setDescription("타임아웃할 멤버를 선택해줘.").setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("초")
        .setDescription("타임아웃 시간(초). 최대 28일이에요.")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(MAX_TIMEOUT_SECONDS)
    )
    .addStringOption((option) =>
      option.setName("사유").setDescription("타임아웃 사유를 적어줘.").setMaxLength(512)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const member = interaction.options.getMember("대상");
    const seconds = interaction.options.getInteger("초", true);
    const reason = interaction.options.getString("사유") || "사유 없음";

    const blockReason = canTimeout(interaction, member);
    if (blockReason) return interaction.editReply({ content: `**${blockReason}**` });
    if (!member.moderatable) return interaction.editReply({ content: "**내 권한으로는 이 멤버를 타임아웃할 수 없어요.**" });

    await member.timeout(seconds * 1000, `${interaction.user.tag}: ${reason}`);

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("타임아웃 적용 완료")
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "대상", value: `${member} (${member.user.tag})\nID: ${member.id}` },
        { name: "처리자", value: `${interaction.user} (${interaction.user.tag})` },
        { name: "시간", value: formatDuration(seconds) },
        { name: "사유", value: reason }
      )
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};
