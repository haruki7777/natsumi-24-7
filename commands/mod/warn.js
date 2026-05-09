import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Warning from "../../models/warnings.js";
import { getWarnSettings, sendWarnLog } from "../../utils/warnSettings.js";

const canAutoKick = (interaction, member) => {
  if (!member) return false;
  if (!member.kickable) return false;
  if (member.id === interaction.guild.ownerId) return false;
  if (interaction.guild.members.me.roles.highest.comparePositionTo(member.roles.highest) <= 0) return false;
  return true;
};

export default {
  data: new SlashCommandBuilder()
    .setName("경고")
    .setDescription("멤버의 경고를 추가하거나 차감해요.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) =>
      option
        .setName("작업")
        .setDescription("경고를 추가할지 차감할지 선택해줘.")
        .setRequired(true)
        .addChoices(
          { name: "추가", value: "add" },
          { name: "차감", value: "remove" },
          { name: "조회", value: "view" }
        )
    )
    .addUserOption((option) =>
      option.setName("대상").setDescription("경고를 처리할 멤버를 선택해줘.").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("횟수").setDescription("처리할 경고 횟수. 기본값은 1회예요.").setMinValue(1).setMaxValue(100)
    )
    .addStringOption((option) =>
      option.setName("사유").setDescription("경고 사유를 적어줘.").setMaxLength(512)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const action = interaction.options.getString("작업", true);
    const user = interaction.options.getUser("대상", true);
    const amount = interaction.options.getInteger("횟수") || 1;
    const reason = interaction.options.getString("사유") || "사유 없음";
    const settings = await getWarnSettings(interaction.guildId);
    const current = await Warning.findOne({ guildID: interaction.guildId, userID: user.id });
    const beforeCount = current?.count || 0;

    if (action === "view") {
      const embed = new EmbedBuilder()
        .setColor("#FFB02E")
        .setTitle("경고 조회")
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "대상", value: `${user} (${user.tag})` },
          { name: "현재 경고", value: `${beforeCount}회`, inline: true },
          { name: "자동 추방 기준", value: settings.autoKickThreshold > 0 ? `${settings.autoKickThreshold}회` : "꺼짐", inline: true },
          { name: "마지막 사유", value: current?.lastReason || "기록 없음" }
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    const nextCount = action === "add" ? beforeCount + amount : Math.max(0, beforeCount - amount);
    const warning = await Warning.findOneAndUpdate(
      { guildID: interaction.guildId, userID: user.id },
      {
        $set: {
          count: nextCount,
          lastReason: reason,
          lastModeratorID: interaction.user.id,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const embed = new EmbedBuilder()
      .setColor(action === "add" ? "#FFB02E" : "#57F287")
      .setTitle(action === "add" ? "경고 추가 완료" : "경고 차감 완료")
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "대상", value: `${user} (${user.tag})\nID: ${user.id}` },
        { name: "처리자", value: `${interaction.user} (${interaction.user.tag})` },
        { name: "변경", value: `${beforeCount}회 → ${warning.count}회`, inline: true },
        { name: "사유", value: reason }
      )
      .setTimestamp();

    await sendWarnLog(interaction.guild, settings, { embeds: [embed] });

    let autoKickResult = "";
    if (action === "add" && settings.autoKickThreshold > 0 && warning.count >= settings.autoKickThreshold) {
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (canAutoKick(interaction, member)) {
        const kickReason = `경고 ${warning.count}회 누적: ${reason}`;
        await member.kick(kickReason);
        autoKickResult = `\n\n자동 추방: 경고 ${warning.count}회가 기준 ${settings.autoKickThreshold}회를 넘어 추방했어요.`;

        const kickEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("경고 누적 자동 추방")
          .setThumbnail(user.displayAvatarURL({ size: 256 }))
          .addFields(
            { name: "추방 대상", value: `${user} (${user.tag})\nID: ${user.id}` },
            { name: "경고 횟수", value: `${warning.count}회`, inline: true },
            { name: "자동 추방 기준", value: `${settings.autoKickThreshold}회`, inline: true },
            { name: "추방 처리자", value: `${interaction.user} (${interaction.user.tag})` },
            { name: "추방 사유", value: kickReason }
          )
          .setTimestamp();
        await sendWarnLog(interaction.guild, settings, { embeds: [kickEmbed] });
      } else {
        autoKickResult = "\n\n자동 추방 기준에 도달했지만 권한/역할 문제로 추방하지 못했어요.";
      }
    }

    if (autoKickResult) embed.setDescription(autoKickResult.trim());
    return interaction.editReply({ embeds: [embed] });
  },
};
