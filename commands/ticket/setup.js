import {
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
  } from "discord.js";
  import ticket_Table from "../../models/ticketDB.js";
  
  export default {
    data: new SlashCommandBuilder()
      .setName("티켓설정")
      .setDescription("우리 숲의 소통 창구(티켓)를 만들까? 콘콘!")
      .addChannelOption((op) =>
        op
          .setName("채널")
          .setDescription("소통 창구를 열 채널을 골라봐.")
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
          .setTitle("🏮 숲의 소통 창구")
          .setDescription("나츠미한테 할 말이 있으면 아래 버튼을 눌러보든가!\n별로 기다리고 있는 건 아니니까! 콘콘!")
          .setColor("#FF7F50");
  
        const Btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("open")
            .setLabel("말 걸기")
            .setEmoji("🏮")
            .setStyle(ButtonStyle.Success)
        );
        channel.send({ embeds: [Embed], components: [Btn] });
        let newTicket = new ticket_Table({
          guildId: interaction.guild.id,
          channelId: channel.id,
          message: "무슨 일로 나를 부른 거야? 용건만 간단히 말해!"
        });
        await newTicket.save();
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${channel} 채널에 소통 창구를 열었어! 콘콘!`)
              .setColor("#FF7F50"),
          ],
        });
      } else {
        const Embed = new EmbedBuilder()
          .setTitle("🏮 숲의 소통 창구")
          .setDescription("나츠미한테 볼일 있어? 그럼 버튼을 눌러야지! 바보야?")
          .setColor("#FF7F50");
  
        const Btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("open")
            .setLabel("말 걸기")
            .setEmoji("🏮")
            .setStyle(ButtonStyle.Success)
        );
        channel.send({ embeds: [Embed], components: [Btn] });
        await ticket_Table.findOneAndUpdate({
          guildId: interaction.guild.id,
        }, {
          channelId: channel.id
        });
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${channel} 채널로 자리를 옮겼어! 콘콘!`)
              .setColor("#FF7F50"),
          ],
        });
      }
    },
  };
  