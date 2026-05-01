const {
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
  } = require("discord.js");
  const ticket_Table = require("../../models/ticketDB");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("티켓설정")
      .setDescription("티켓 채널을 설정하라냥")
      .addChannelOption((op) =>
        op
          .setName("채널")
          .setDescription("티켓 채널을 선택해주라냥")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    /**
     *
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) { 
      await interaction.deferReply();
      const channel = interaction.options.getChannel("채널");
      const ticket_Find = await ticket_Table.findOne({
        guildId: interaction.guild.id,
      });
      if (!ticket_Find) {
        const Embed = new EmbedBuilder()
          .setTitle("티켓")
          .setDescription("티켓버튼을 누르라냥!")
          .setColor("Orange");
  
        const Btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("open")
            .setLabel("열기")
            .setEmoji("💌")
            .setStyle(ButtonStyle.Success)
        );
        channel.send({ embeds: [Embed], components: [Btn] });
        let newTicket = new ticket_Table({
          guildId: interaction.guild.id,
          channelId: channel.id,
        });
        newTicket.save();
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${channel} 채널로 티켓설정이 완료되었다냥`)
              .setColor("Orange"),
          ],
        });
      } else {
        const Embed = new EmbedBuilder()
          .setTitle("티켓")
          .setDescription("티켓이다냥!문의사항을 말하라냥!!")
          .setColor("Orange");
  
        const Btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`open_${interaction.member.user.id}`)
            .setLabel("열기")
            .setEmoji("💌")
            .setStyle(ButtonStyle.Success)
        );
        channel.send({ embeds: [Embed], components: [Btn] });
        await ticket_Table.findOneAndUpdate({
          guildId: interaction.guild.id,
          channelId: channel.id,
        });
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${channel} 채널로 티켓채널이 변경되었다냥!!`)
              .setColor("Orange"),
          ],
        });
      }
    },
  };
  