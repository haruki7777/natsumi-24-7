import { ChannelType, Events } from "discord.js";
import DashboardSettings from "../models/DashboardSettings.js";
import { buildMemberCard } from "../utils/welcomeCard.js";

export default {
  name: Events.GuildMemberRemove,

  async execute(member) {
    const settings = await DashboardSettings.findOne({ guildId: member.guild.id }).catch(() => null);
    if (!settings?.welcome?.enabled) return;

    const saved = settings.welcome.lastWelcomeMessages?.get(member.id);
    if (settings.welcome.cleanupOnLeave && saved) {
      const [channelId, messageId] = saved.split(":");
      const oldChannel = await member.guild.channels.fetch(channelId).catch(() => null);
      const oldMessage = await oldChannel?.messages?.fetch(messageId).catch(() => null);
      await oldMessage?.delete().catch(() => null);
      settings.welcome.lastWelcomeMessages.delete(member.id);
      await settings.save().catch(() => null);
    }

    const leaveChannelId = settings.welcome.leaveChannelId || settings.welcome.channelId;
    if (!leaveChannelId) return;

    const channel = await member.guild.channels.fetch(leaveChannelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) return;

    const card = await buildMemberCard(member, "leave").catch(() => null);
    await channel.send({
      content: `**${member.user.username}** 님이 서버를 떠났어.`,
      files: card ? [card] : [],
    }).catch(() => null);
  },
};
