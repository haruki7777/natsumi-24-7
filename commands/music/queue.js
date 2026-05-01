const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const manager = require("../../src/erela");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("재생목록")
    .setDescription("재생목록을 확인해요"),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const player = manager.get(interaction.guildId);
    if (!player || !player.playing) {
      return interaction.editReply({ content: `**재생 중인 음악이 없어요**` });
    }

    let embed_ds = [];
    embed_ds.push(
      `0. [${player.queue.current.title}](${
        player.queue.current.uri
      }) (${new Date(player.queue.current.duration)
        .toISOString()
        .slice(14, 19)}) by \`${player.queue.current.requester.tag}\``
    );
    for (let i = 0; i < player.queue.length; i++) {
      embed_ds.push(
        `${i + 1}. [${player.queue[i].title}](${
          player.queue[i].uri
        }) (${new Date(player.queue[i].duration)
          .toISOString()
          .slice(14, 19)}) by \`${player.queue[i].requester.tag}\``
      );
    }

    if (`**${embed_ds.join("\n")}**`.length > 4096) {
      return interaction.editReply({
        content: `**재생목록에 노래가 너무 많아 표시할 수 없어요**`,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`노래 재생목록`)
      .setColor("Green")
      .setFooter({
        text: `${interaction.guild.name} • 재생목록 0번째는 현재 재생 중인 곡입니다`,
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(`**${embed_ds.join("\n")}**`);
    interaction.editReply({
      embeds: [embed],
    });
  },
};
