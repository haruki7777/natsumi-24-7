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
                `${interaction.user.username}님은 이미 진행중인 티켓이 있다냥 ${channel1}`
              )
              .setColor("Red"),
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
        content: find.message,
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `${interaction.user.tag}`,
              iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}`,
            })
            .setTitle("티켓 생성됨")
            .setColor("Orange")
            .setDescription(`${UserName}님의 티켓이 생성되었다냥`),
        ],
        components: [
          new ActionRowBuilder({
            components: [
              new ButtonBuilder()
                .setCustomId("close")
                .setLabel("티켓 닫기")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("💥"),
            ],
          }),
        ],
      });
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Random")
            .setDescription(`${channel} 채널로 이동하라냥`),
        ],
        ephemeral: true,
      });
    },
  };