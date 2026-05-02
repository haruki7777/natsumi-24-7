const {
    EmbedBuilder,
    AuditLogEvent,
    PermissionFlagsBits,
  } = require("discord.js");
  const db = require("../models/MemberLogdb");
  
  module.exports = {
    name: "guildMemberRemove",
    /**
     *
     * @param {import("discord.js").GuildMember} member
     */
    async execute(member) {
      const db_find = await db.findOne({ guildId: member.guild.id });
      if(!db_find) return
      const channel = member.guild.channels.cache.get(db_find.channelId);
      if (
        !member.guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)
      )
        return;
      const fetchLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberKick,
      });
      const kickLog = fetchLogs.entries.first();
      if (kickLog) {
        const { executor, target, createdTimestamp, reason } = kickLog;
        if (target.id == member.id && createdTimestamp > member.joinedTimestamp) {
          const KickEmbed = new EmbedBuilder()
            .setTitle("추방 로그")
            .addFields(
              {
                name: "대상",
                value: `**<@${member.user.id}> (${member.user.tag})**`,
              },
              { name: "처리자", value: `**<@${executor.id}> (${executor.tag})**` },
              { name: "사유", value: `**\`${reason || "없음"}\`**` }
            )
            .setThumbnail(`${member.displayAvatarURL({ dynamic: true })}`)
            .setColor("Yellow");
          if (channel) {
            channel.send({ embeds: [KickEmbed] }).catch(() => {});
          }
          return;
        }
      }

      const fetchBans = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd,
      });
      const bansLogs = fetchBans.entries.first();
      if (bansLogs) {
        if (
          bansLogs.target.id == member.id &&
          bansLogs.createdTimestamp > member.joinedTimestamp
        ) {
          const BanEmbed = new EmbedBuilder()
            .setTitle("밴 로그")
            .addFields(
              {
                name: "대상",
                value: `**<@${member.user.id}> (${member.user.tag})**`,
              },
              {
                name: "처리자",
                value: `**<@${bansLogs.executor.id}> (${bansLogs.executor.tag})**`,
              },
              { name: "사유", value: `**\`${bansLogs.reason || "없음"}\`**` }
            )
            .setThumbnail(`${member.displayAvatarURL({ dynamic: true })}`)
            .setColor("Red");
          if (channel) {
            channel.send({ embeds: [BanEmbed] }).catch(() => {});
          }
          return;
        }
      }
    },
  };