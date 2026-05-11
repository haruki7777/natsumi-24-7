import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, PermissionFlagsBits } from "discord.js";
import { buildNatsumiSetupEmbed } from "../utils/natsumiChannelSetup.js";

const findSetupChannel = (guild) => {
  if (guild.systemChannel?.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)) {
    return guild.systemChannel;
  }

  return guild.channels.cache.find((channel) =>
    channel.isTextBased?.() &&
    channel.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
  );
};

export default {
  name: Events.GuildCreate,
  async execute(guild) {
    const channel = findSetupChannel(guild);
    if (!channel) return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("NatsumiSetup_create")
        .setLabel("카미봇 채널 자동으로 만들기")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🦊"),
      new ButtonBuilder()
        .setLabel("웹후크 이동하기나 없애기")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("NatsumiSetup_ignore")
        .setDisabled(true)
    );

    await channel.send({ embeds: [buildNatsumiSetupEmbed()], components: [row] }).catch(() => {});
  },
};
