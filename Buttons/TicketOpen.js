import {
    EmbedBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
  } from "discord.js";
import Schema from "../models/ticketDB.js";
  
  export default {
    name: "open",
    /**
     *
     * @param {import("discord.js").ButtonInteraction} interaction
     */
    async execute(interaction) {
      const find = await Schema.findOne({ guildId: interaction.guildId });
      if (!find) return;
      const UserName = interaction.user.username;
      const channel1 = interaction.guild.channels.cache.find(
        (f) => f.name == `${UserName}-${interaction.user.id}`
      );
      if (channel1) {
        interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `흥! 이미 나랑 대화하고 있는 방이 있잖아! 저기로 가라고! ${channel1}`
              )
              .setColor("#FF7F50"),
          ],
          ephemeral: true,
        });
        return;
      }
      const channel = await interaction.guild.channels.create({
        name: `${UserName}-${interaction.user.id}`,
        parent: interaction.channel.parent.id,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.member.user.id,
            allow: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });
      channel.send({
        content: `<@${interaction.user.id}>, ${find.message}`,
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `${interaction.user.username}`,
              iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}`,
            })
            .setTitle("🏮 소통의 문이 열렸어")
            .setColor("#FF7F50")
            .setDescription(`${UserName} 녀석이 나를 찾아왔어! 콘콘!`),
        ],
        components: [
          new ActionRowBuilder({
            components: [
              new ButtonBuilder()
                .setCustomId("close")
                .setLabel("대화 종료")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("🏮"),
            ],
          }),
        ],
      });
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF7F50")
            .setDescription(`저기 ${channel} 채널로 가봐. 별로 기다린 건 아니니까! 흥!`),
        ],
        ephemeral: true,
      });
    },
  };