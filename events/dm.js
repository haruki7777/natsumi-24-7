//Events/* 폴더에 넣어주세요
const ment = "냐하핫 나를 불러줘서 고맙다냥!."; //정해주세요!

const {
  EmbedBuilder,
  PermissionFlagsBits,
  AuditLogEvent,
} = require("discord.js");

module.exports = {
  name: "guildCreate",
  /**
   * @param {import("discord.js").Guild} guild
   */
  async execute(guild) { 
    const embed = new EmbedBuilder()
      .setDescription(ment)
      .setTitle(`${guild.name} 서버에 초대해 주셔서 감사합니다`)
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
