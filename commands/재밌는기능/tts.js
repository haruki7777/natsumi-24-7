// Commands/* 폴더에 넣어주세요
// 터미널에 입력해 주세요 npm i @discordjs/voice google-tts-api ffmpeg-static libsodium-wrappers
const voicechannelleave_option = "X"; //tts가 종료되면 음성채널을 자동으로 나갈지 입력해 주세요 O = 나감 | X = 안나감
if (!voicechannelleave_option) {
  return console.log(`tts.js 옵션을 설정해 주세요`);
}

const { SlashCommandBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  NoSubscriberBehavior,
  createAudioResource,
} = require("@discordjs/voice");
const { getAudioUrl } = require("google-tts-api");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tts")
    .setDescription("음성채널에서 tts를 재생한다냥")
    .addStringOption((f) =>
      f
        .setName("text")
        .setDescription("tts로 재생할 text를 입력해 주라냥")
        .setRequired(true)
        .setMaxLength(200)
    ),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const tts_text = interaction.options.getString("text");
    const uservoice = interaction.member.voice?.channel;
    if (!uservoice) {
      return interaction.editReply({ content: `**음성채널에 접속해 주라냥**` });
    }

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop,
      },
    });

    const tts_url = getAudioUrl(`${tts_text}`, {
      lang: "ko",
      slow: false,
      host: "https://translate.google.com",
    });

    const resource = createAudioResource(tts_url);

    const connection = joinVoiceChannel({
      channelId: uservoice.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    connection.subscribe(player);

    if (connection.state.status == "ready") {
      player.play(resource);
      interaction.editReply({ content: `**TTS 말하는중이다냥!**` });

      player.on("stateChange", (oldst, newst) => {
        if (newst.status == "idle") {
          interaction.editReply({ content: `**TTS를 모두 말했다냥!**` });
          if (voicechannelleave_option == "O") {
            connection.destroy();
          }
        }
      });
    } else {
      setTimeout(() => {
        player.play(resource);
        interaction.editReply({ content: `**TTS 말하는중이다냥!**` });

        player.on("stateChange", (oldst, newst) => {
          if (newst.status == "idle") {
            interaction.editReply({ content: `**TTS를 모두 말했다냥!**` });
            if (voicechannelleave_option == "O") {
              connection.destroy();
            }
          }
        });
      }, 1000);
    }
  },
};
