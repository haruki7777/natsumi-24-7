//Events/* 폴더에 넣어주세요
const ment = "콘콘! 나를 숲으로 초대해 줘서 고마워. \n앞으로 네가 평화롭게 지낼 수 있도록 내가 잘 지켜봐 줄게. (흥!)"; //정해주세요!

import {
  EmbedBuilder,
  PermissionFlagsBits,
  AuditLogEvent,
} from "discord.js";

export default {
  name: "guildCreate",
  /**
   * @param {import("discord.js").Guild} guild
   */
  async execute(guild) { 
    const embed = new EmbedBuilder()
      .setDescription(ment)
      .setTitle(`🏮 ${guild.name} 서버에 강림했어!`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setTimestamp()
      .setURL(`https://discord.com/channels/${guild.id}`)
      .setColor("Orange");
    const guildme = guild.members.me;
    if (guildme.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
      const fetchlog = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.BotAdd,
      });
      if (fetchlog?.entries?.first()) {
        try {
          await fetchlog.entries.first().executor.send({
            embeds: [embed],
          });
        } catch (error) {
          if (error.message == "Cannot send messages to this user") return;
          else console.log(error);
        }
      }
    } else {
      const owner = await guild.fetchOwner();
      try {
        await owner.send({
          embeds: [embed],
        });
      } catch (error) {
        if (error.message == "Cannot send messages to this user") return;
        else console.log(error);
      }
    }
  },
};
