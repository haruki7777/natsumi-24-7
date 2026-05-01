const { SlashCommandBuilder, enableValidators } = require("discord.js");
const manager = require("../../src/erela");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("재생")
    .setDescription("음악을 재생해요")
    .addStringOption((f) =>
      f
        .setName("검색어")
        .setDescription("검색어를 입력해 주세요")
        .setRequired(true)
    ),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const member_voice = interaction.member.voice?.channel;
    if (!member_voice) {
      return interaction.editReply({
        content: `**음성 채널에 접속해 주세요**`,
      });
    }

    const search_word = interaction.options.getString("검색어");

    let res;

    try {
      res = await manager.search(search_word, interaction.user);
      if (res.loadType == "LOAD_FAILED" || res.loadType == "NO_MATCHES")
        throw res.exception;
      if (res.loadType == "PLAYLIST_LOADED") {
        return interaction.editReply({
          content: `**플레이리스트는 재생할 수 없습니다**`,
        });
      }
    } catch (error) {
      return interaction.editReply({ content: `**노래를 불러오지 못했어요**` });
    }

    let player = manager.get(interaction.guildId);

    if (!player) {
      player = manager.create({
        guild: interaction.guildId,
        textChannel: interaction.channel.id,
        selfDeafen: true,
        voiceChannel: member_voice.id,
      });
      player.connect();
    }

    player.queue.add(res.tracks[0]);

    if (!player.playing && !player.paused && !player.queue.size) {
      player.play();
    }

    interaction.editReply({
      content: `**[${res.tracks[0].title} (${new Date(res.tracks[0].duration)
        .toISOString()
        .slice(14, 19)})](<${
        res.tracks[0].uri
      }>) 을/를 재생목록에 추가할게요**`,
    });
  },
};
