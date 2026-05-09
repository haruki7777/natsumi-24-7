import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import WarnSettings from "../../models/WarnSettings.js";
import { buildWarnSettingsEmbed, getWarnSettings } from "../../utils/warnSettings.js";

export default {
  data: new SlashCommandBuilder()
    .setName("경고설정")
    .setDescription("경고 로그 채널과 자동 추방 기준을 설정해요.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("로그채널")
        .setDescription("경고/자동추방 기록을 보낼 채널을 선택해줘.")
        .addChannelTypes(ChannelType.GuildText)
    )
    .addIntegerOption((option) =>
      option
        .setName("자동추방횟수")
        .setDescription("경고가 몇 회 이상이면 자동 추방할지 입력해줘. 0이면 꺼짐.")
        .setMinValue(0)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const logChannel = interaction.options.getChannel("로그채널");
    const threshold = interaction.options.getInteger("자동추방횟수");

    if (logChannel || threshold !== null) {
      const update = {};
      if (logChannel) update.logChannelID = logChannel.id;
      if (threshold !== null) update.autoKickThreshold = threshold;
      await WarnSettings.findOneAndUpdate(
        { guildID: interaction.guildId },
        { $set: update, $setOnInsert: { guildID: interaction.guildId } },
        { new: true, upsert: true }
      );
    }

    const settings = await getWarnSettings(interaction.guildId);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("WarnSettings_log")
        .setLabel("로그 채널 설정")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("WarnSettings_threshold")
        .setLabel("자동 추방 횟수 설정")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("WarnSettings_disable")
        .setLabel("자동 추방 끄기")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.editReply({
      embeds: [buildWarnSettingsEmbed(settings, interaction.guild)],
      components: [row],
    });
  },
};
