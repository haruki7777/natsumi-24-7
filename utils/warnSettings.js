import { ChannelType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import WarnSettings from "../models/WarnSettings.js";

export const getWarnSettings = async (guildID) => {
  return WarnSettings.findOneAndUpdate(
    { guildID },
    { $setOnInsert: { guildID, autoKickThreshold: 0 } },
    { new: true, upsert: true }
  );
};

export const buildWarnSettingsEmbed = (settings, guild) => {
  const logChannel = settings.logChannelID ? `<#${settings.logChannelID}>` : "설정 안 됨";
  const threshold = settings.autoKickThreshold > 0 ? `${settings.autoKickThreshold}회 이상이면 자동 추방` : "꺼짐";

  return new EmbedBuilder()
    .setColor("#FFB02E")
    .setTitle("경고 설정")
    .setDescription(`${guild.name}의 경고 시스템 설정이에요.`)
    .addFields(
      { name: "로그 채널", value: logChannel, inline: true },
      { name: "자동 추방", value: threshold, inline: true }
    )
    .setTimestamp();
};

export const resolveLogChannel = async (guild, settings) => {
  if (!settings?.logChannelID) return null;
  const channel = guild.channels.cache.get(settings.logChannelID) || await guild.channels.fetch(settings.logChannelID).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return null;
  const me = guild.members.me;
  if (!channel.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
    return null;
  }
  return channel;
};

export const sendWarnLog = async (guild, settings, payload) => {
  const channel = await resolveLogChannel(guild, settings);
  if (!channel) return false;

  await channel.send(payload).catch(() => null);
  return true;
};
