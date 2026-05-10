import { Events, PermissionFlagsBits } from "discord.js";
import WelcomeSettings from "../models/WelcomeSettings.js";
import { buildWelcomeContent, createWelcomeCard } from "../utils/welcomeCard.js";

export default {
  name: Events.GuildMemberAdd,

  async execute(member) {
    const settings = await WelcomeSettings.findOne({ guildID: member.guild.id, enabled: true }).lean();
    if (!settings?.channelID) return;

    const channel = member.guild.channels.cache.get(settings.channelID) || await member.guild.channels.fetch(settings.channelID).catch(() => null);
    if (!channel?.isTextBased?.()) return;

    const permissions = channel.permissionsFor(member.guild.members.me);
    if (!permissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles])) return;

    try {
      const card = await createWelcomeCard(member, settings.message);
      await channel.send({
        content: buildWelcomeContent(settings.message, member),
        files: [card],
      });
    } catch (error) {
      console.error(`[Welcome] Failed to send welcome card in ${member.guild.id}:`, error.message);
      await channel.send({
        content: buildWelcomeContent(settings.message, member),
      }).catch(() => null);
    }
  },
};
