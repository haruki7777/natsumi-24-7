const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const client = require("../../index");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("핑")
    .setDescription("봇의 핑을 확인한다냥!"),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const msg = await interaction.fetchReply();
    const client_ping = client.ws.ping;
    const command_ping = msg.createdTimestamp - interaction.createdTimestamp;
    
    let ping_st, command_st;
    if (client_ping < 250) ping_st = "🟢";
    else if (client_ping < 500) ping_st = "🟠";
    else ping_st = "🔴";

    if (command_ping < 500) command_st = "🟢";
    else if (command_ping < 1000) command_st = "🟠";
    else command_st = "🔴";

    let embed_color = {
      "🟢": "#00FF00",
      "🟠": "#FFA500",
      "🔴": "#ff0000",
    };
    
    const time = Math.round(client.readyTimestamp / 1000);
    const embed = new EmbedBuilder()
      .setTitle("🏓 퐁!")
      .addFields(
        {
          name: `슬커 응답속도`,
          value: `**${command_ping}ms** (${command_st})`,
          inline: true,
        },
        {
          name: `봇 지연시간`,
          value: `**${client_ping}ms** (${ping_st})`,
          inline: true,
        },
        {
          name: `업타임`,
          value: `**<t:${time}:D> (<t:${time}:R>)**`,
        }
      )
      .setColor(embed_color[ping_st])
      .setFooter({
        iconURL: `${client.user.displayAvatarURL()}`,
        text: `${client.user.username}`,
      })
      .setThumbnail(client.user.displayAvatarURL())
      .setTimestamp();
      
    await interaction.editReply({
      embeds: [embed],
    });
  },
};
