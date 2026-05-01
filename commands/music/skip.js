const { SlashCommandBuilder } = require("discord.js");
const manager = require("../../src/erela");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("스킵")
    .setDescription("음악을 스킵해요"),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const player = manager.get(interaction.guildId);
    if (!player || !player.playing) {
      return interaction.editReply({ content: `**재생 중인 음악이 없어요**` });
    }

    player.stop();

    interaction.editReply({
      content: `**[${player.queue.current.title} (${new Date(
        player.queue.current.duration
      )
        .toISOString()
        .slice(14, 19)})](<${player.queue.current.uri}>) 을/를 스킵 할게요**`,
    });
  },
};
