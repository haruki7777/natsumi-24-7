//Events 폴더에 넣어주세요
const { Events } = require("discord.js");
const tts_Schema = require("../models/tts");

const {
  joinVoiceChannel,
  createAudioPlayer,
  NoSubscriberBehavior,
  createAudioResource,
} = require("@discordjs/voice");
const { getAudioUrl } = require("google-tts-api");

module.exports = {
  name: Events.MessageCreate,
  /**
   *
   * @param {import("discord.js").Message} message
   */
  async execute(message) {
    if (message.author.bot) return;
    const tts_find = await tts_Schema.findOne({ channelid: message.channelId });
    if (tts_find) {
      const memberVoicechannel = message.member.voice?.channel;
      if (!memberVoicechannel) return;
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Stop,
        },
      });

      const tts_url = getAudioUrl(`${message.content.slice(0, 200)}`, {
        lang: "ko",
        slow: false,
        host: "https://translate.google.com",
      });

      const resource = createAudioResource(tts_url);

      const connection = joinVoiceChannel({
        channelId: memberVoicechannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      connection.subscribe(player);

      if (connection.state.status == "ready") {
        player.play(resource);
        const msg = await message.reply({ content: `**TTS 말하는중**` });

        player.on("stateChange", (oldst, newst) => {
          if (newst.status == "idle") {
            msg.edit({ content: `**TTS를 모두 말했어요!**` });
          }
        });
      } else {
        setTimeout(async () => {
          player.play(resource);
          const msg = await message.reply({ content: `**TTS 말하는중**` });

          player.on("stateChange", (oldst, newst) => {
            if (newst.status == "idle") {
              msg.edit({ content: `**TTS를 모두 말했어요!**` });
            }
          });
        }, 1000);
      }
    }
  },
};
