const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("스티커")
    .setDescription("스티커를 스틸한다냥")
    .addSubcommand((f) =>
      f.setName("스틸").setDescription("스티커를 스틸한다냥")
    ),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    interaction.editReply({ content: `**스티커를 보내주라냥**` });
    const collector = interaction.channel.awaitMessages({
      max: 1,
      time: 60000,
      filter: (i) => i.stickers.size == 1 && i.author.id == interaction.user.id,
    });
    if (collector) {
      const message = (await collector).first();
      const message_sticker = message.stickers.first();
      let sticker;
      try {
        sticker = await interaction.guild.stickers.create({
          name: `${message_sticker.name}`,
          description: `${message_sticker.name}`,
          reason: `${interaction.user.tag}님의 명령어 사용인것이다냥!`,
          file: `https://media.discordapp.net/stickers/${message_sticker.id}.png?size=160`,
        });
      } catch (error) {
        return interaction.editReply({
          content: `**스티커 자리가 부족하거나 권한이 없다냥!.**`,
        });
      }
      message.delete();
      interaction.editReply({
        content: `**스티커를 스틸 했다냥 내가 한번 써겠다냥!**`,
      });
      interaction.channel.send({ stickers: [sticker] });
    }
  },
};
