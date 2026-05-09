import {
  ActionRowBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import WarnSettings from "../models/WarnSettings.js";
import { buildWarnSettingsEmbed, getWarnSettings } from "../utils/warnSettings.js";

const requireManageGuild = async (interaction) => {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  await interaction.reply({
    content: "**경고 설정은 서버 관리 권한이 있어야 바꿀 수 있어요.**",
    ephemeral: true,
  }).catch(() => null);
  return false;
};

export default {
  name: "WarnSettings",

  async execute(interaction) {
    if (!(await requireManageGuild(interaction))) return;

    if (interaction.isButton() && interaction.customId === "WarnSettings_log") {
      const input = new TextInputBuilder()
        .setCustomId("logChannelID")
        .setLabel("로그 채널 ID")
        .setPlaceholder("예: 123456789012345678")
        .setRequired(true)
        .setStyle(TextInputStyle.Short);

      return interaction.showModal(
        new ModalBuilder()
          .setCustomId("WarnSettings_log_modal")
          .setTitle("경고 로그 채널 설정")
          .addComponents(new ActionRowBuilder().addComponents(input))
      );
    }

    if (interaction.isButton() && interaction.customId === "WarnSettings_threshold") {
      const input = new TextInputBuilder()
        .setCustomId("autoKickThreshold")
        .setLabel("자동 추방 경고 횟수")
        .setPlaceholder("예: 3")
        .setRequired(true)
        .setStyle(TextInputStyle.Short);

      return interaction.showModal(
        new ModalBuilder()
          .setCustomId("WarnSettings_threshold_modal")
          .setTitle("자동 추방 횟수 설정")
          .addComponents(new ActionRowBuilder().addComponents(input))
      );
    }

    if (interaction.isButton() && interaction.customId === "WarnSettings_disable") {
      await WarnSettings.findOneAndUpdate(
        { guildID: interaction.guildId },
        { $set: { autoKickThreshold: 0 }, $setOnInsert: { guildID: interaction.guildId } },
        { new: true, upsert: true }
      );
      const settings = await getWarnSettings(interaction.guildId);
      return interaction.reply({
        content: "자동 추방을 껐어요.",
        embeds: [buildWarnSettingsEmbed(settings, interaction.guild)],
        ephemeral: true,
      });
    }

    if (interaction.isModalSubmit() && interaction.customId === "WarnSettings_log_modal") {
      const channelID = interaction.fields.getTextInputValue("logChannelID").trim();
      const channel = interaction.guild.channels.cache.get(channelID) || await interaction.guild.channels.fetch(channelID).catch(() => null);
      if (!channel?.isTextBased?.()) {
        return interaction.reply({ content: "**텍스트 채널 ID를 제대로 넣어줘.**", ephemeral: true });
      }

      await WarnSettings.findOneAndUpdate(
        { guildID: interaction.guildId },
        { $set: { logChannelID: channel.id }, $setOnInsert: { guildID: interaction.guildId } },
        { new: true, upsert: true }
      );
      const settings = await getWarnSettings(interaction.guildId);
      return interaction.reply({
        content: "경고 로그 채널을 저장했어요.",
        embeds: [buildWarnSettingsEmbed(settings, interaction.guild)],
        ephemeral: true,
      });
    }

    if (interaction.isModalSubmit() && interaction.customId === "WarnSettings_threshold_modal") {
      const raw = interaction.fields.getTextInputValue("autoKickThreshold").trim();
      const threshold = Number(raw);
      if (!Number.isInteger(threshold) || threshold < 0 || threshold > 100) {
        return interaction.reply({ content: "**0~100 사이 숫자로 넣어줘. 0은 자동 추방 끄기야.**", ephemeral: true });
      }

      await WarnSettings.findOneAndUpdate(
        { guildID: interaction.guildId },
        { $set: { autoKickThreshold: threshold }, $setOnInsert: { guildID: interaction.guildId } },
        { new: true, upsert: true }
      );
      const settings = await getWarnSettings(interaction.guildId);
      return interaction.reply({
        content: "자동 추방 기준을 저장했어요.",
        embeds: [buildWarnSettingsEmbed(settings, interaction.guild)],
        ephemeral: true,
      });
    }
  },
};
